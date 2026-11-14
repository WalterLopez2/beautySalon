// Prueba la API de punta a punta por HTTP, con dobles en lugar de PostgreSQL.
// Los casos de uso de seguridad (sesion, limites) son los reales.

import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import { ConsultarAgendaDelDia } from '../src/clienta/ConsultarAgendaDelDia';
import type { CitaRegistrada } from '../src/compartido/citas/repositorioCitas';
import { Cliente } from '../src/compartido/clientes/repositorioClientes';
import type { Bloqueo } from '../src/compartido/dominio/bloqueos';
import { NoAutorizado } from '../src/compartido/errores';
import { hashDeCodigo } from '../src/compartido/seguridad/codigosDeConsulta';
import { LimitadorDeIntentos } from '../src/compartido/seguridad/LimitadorDeIntentos';
import { EmisorDeTokens } from '../src/duena/autenticacion/tokens';
import { CerrarSesion, VerificarSesion } from '../src/duena/autenticacion/VerificarSesion';
import { CrearBloqueo } from '../src/duena/configuracion/CrearBloqueo';
import { GuardarHorario } from '../src/duena/configuracion/GuardarHorario';

// ----- Datos de prueba -----

const UNA_HORA = 60 * 60 * 1000;
const DOMINGO = 7;
const CODIGO_DE_ANA = 'ABCDE23456';
const TELEFONO_DE_ANA = '99990000';

const tokens = new EmisorDeTokens('una-clave-secreta-de-pruebas-de-32-caracteres', UNA_HORA);
let versionDeSesion = 0;
const versiones = {
  versionDeSesion: async () => versionDeSesion,
  revocarSesiones: async () => {
    versionDeSesion++;
  },
};
const tokenNuevo = () => tokens.emitir(1, 'Delmy', versionDeSesion).token;

const cita: CitaRegistrada = {
  id: 5,
  servicioId: 1,
  servicioNombre: 'Manicura',
  fecha: '2026-11-10',
  inicio: '10:00',
  duracionMin: 60,
  estado: 'pendiente',
  precio: 250,
  clienta: { id: 7, nombre: 'Ana', telefono: TELEFONO_DE_ANA, correo: null },
};

const configuracionDelSalon = { zonaHoraria: 'America/Tegucigalpa', intervaloMin: 30, maxCitasPendientes: 2 };
const servicioDelPanel = {
  id: 1,
  nombre: 'Manicura',
  descripcion: null,
  precio: 250,
  duracionMin: 60,
  categoria: 'Uñas',
  activo: true,
};

// Feriado el 11 de noviembre; el 10 de noviembre no atiende de 12:00 a 13:00.
const bloqueosDelSalon: Bloqueo[] = [
  { id: 1, desde: '2026-11-11', hasta: '2026-11-11', inicioMin: null, finMin: null, motivo: 'Feriado' },
  { id: 2, desde: '2026-11-10', hasta: '2026-11-10', inicioMin: 720, finMin: 780, motivo: 'Tramite' },
];
const repositorioDeBloqueos = {
  delDia: async (fecha: string) => bloqueosDelSalon.filter((b) => b.desde <= fecha && fecha <= b.hasta),
  entre: async () => bloqueosDelSalon,
  crear: async (datos: Omit<Bloqueo, 'id'>) => ({ id: 3, ...datos }),
  eliminar: async (id: number) => id === 1,
};

// Limites bajos para poder comprobar el 429 sin cientos de peticiones.
const limiteDeAgendar = new LimitadorDeIntentos({ intentos: 3, ventanaMs: UNA_HORA });

const app = crearApp({
  clienta: {
    consultarAgenda: new ConsultarAgendaDelDia({
      bloqueos: repositorioDeBloqueos,
      citas: { ocupadasEl: async () => [{ inicioMin: 600, duracionMin: 60 }] },
      horario: {
        obtenerConfiguracion: async () => configuracionDelSalon,
        // Abre de lunes a sabado de 9:00 a 18:00; el domingo esta cerrado.
        horarioDelDia: async (dia) => (dia === DOMINGO ? null : { aperturaMin: 540, cierreMin: 1080 }),
      },
    }),
    servicios: { listarActivos: async () => [] },
    citas: {
      listarPorTelefonoYCodigo: async (telefono, codigoHash) =>
        telefono === TELEFONO_DE_ANA && codigoHash === hashDeCodigo(CODIGO_DE_ANA) ? [cita] : [],
    },
    agendarCita: { ejecutar: async () => ({ cita, codigoDeConsulta: CODIGO_DE_ANA }) },
    limites: {
      agendar: limiteDeAgendar,
      consultarHistorial: new LimitadorDeIntentos({ intentos: 50, ventanaMs: UNA_HORA }),
    },
  },
  duena: {
    iniciarSesion: {
      ejecutar: async ({ contrasena }) => {
        if (contrasena !== 'correcta') throw new NoAutorizado('Usuario o contrasena incorrectos.');
        return { token: tokenNuevo(), nombre: 'Delmy', expiraEn: new Date().toISOString() };
      },
    },
    verificarSesion: new VerificarSesion(tokens, versiones),
    cerrarSesion: new CerrarSesion(versiones),
    cambiarEstadoDeCita: { ejecutar: async (_id, estado) => ({ ...cita, estado }) },
    citas: { listarEntre: async () => [cita], listarPorCliente: async () => [cita] },
    clientes: {
      listar: async () => [],
      obtenerPorId: async (id) => (id === 7 ? new Cliente(7, 'Ana', TELEFONO_DE_ANA, null, new Date()) : null),
    },
    configuracion: {
      servicios: {
        listarTodos: async () => [servicioDelPanel],
        crear: async (datos) => ({ id: 2, activo: true, ...datos }),
        actualizar: async (id, datos) => (id === 1 ? { ...servicioDelPanel, ...datos } : null),
        cambiarActivo: async (id, activo) => (id === 1 ? { ...servicioDelPanel, activo } : null),
      },
      horario: { obtenerSemanal: async () => null },
      // El caso de uso real, con una transaccion falsa: asi se prueban sus validaciones.
      guardarHorario: new GuardarHorario((trabajo) => trabajo({ guardarSemanal: async () => {} })),
    },
    bloqueos: {
      bloqueos: repositorioDeBloqueos,
      crearBloqueo: new CrearBloqueo({ bloqueos: repositorioDeBloqueos, citas: { listarEntre: async () => [cita] } }),
    },
  },
});

// ----- Servidor y ayudantes -----

let servidor: Server;
let base: string;

beforeAll(async () => {
  servidor = app.listen(0);
  await new Promise((listo) => servidor.once('listening', listo));
  base = `http://localhost:${(servidor.address() as AddressInfo).port}/api`;
});

afterAll(() => {
  servidor.close();
});

function pedir(ruta: string, opciones: RequestInit = {}) {
  return fetch(`${base}${ruta}`, opciones);
}

function conJson(metodo: string, cuerpo: unknown, token?: string): RequestInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { method: metodo, headers, body: JSON.stringify(cuerpo) };
}

function conSesion(token = tokenNuevo()): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

const solicitudValida = {
  servicioId: 1,
  fecha: '2026-11-10',
  inicio: '10:00',
  contacto: { nombre: 'Ana', telefono: '9999-0000', correo: null },
};

// ----- Pruebas -----

describe('API publica (clienta)', () => {
  it('responde la agenda con el horario y las horas no disponibles', async () => {
    const respuesta = await pedir('/citas/agenda?fecha=2026-11-10');

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      fecha: '2026-11-10',
      abierto: true,
      apertura: '09:00',
      cierre: '18:00',
      intervaloMin: 30,
      ocupadas: [
        { inicio: '10:00', duracionMin: 60 },
        { inicio: '12:00', duracionMin: 60 }, // bloqueo, sin decir el motivo
      ],
    });
  });

  it('muestra cerrado un dia libre, sin revelar el motivo', async () => {
    const cuerpo = await (await pedir('/citas/agenda?fecha=2026-11-11')).json();

    expect(cuerpo).toMatchObject({ abierto: false, ocupadas: [] });
    expect(JSON.stringify(cuerpo)).not.toContain('Feriado');
  });

  it('indica cuando el salon no abre ese dia de la semana', async () => {
    const respuesta = await pedir('/citas/agenda?fecha=2026-11-15');

    expect(await respuesta.json()).toMatchObject({ abierto: false, apertura: null, cierre: null });
  });

  it('agenda una cita, entrega el codigo de consulta y no devuelve datos de contacto', async () => {
    const respuesta = await pedir('/citas', conJson('POST', solicitudValida));
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.codigoDeConsulta).toBe(CODIGO_DE_ANA);
    expect(cuerpo).not.toHaveProperty('clienta');
  });

  it('explica que dato esta mal', async () => {
    const respuesta = await pedir('/citas', conJson('POST', { servicioId: 1, fecha: '10/11/2026' }));

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).mensaje).toContain('fecha');
  });

  it('responde 400 si el JSON esta mal formado', async () => {
    const respuesta = await pedir('/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ roto',
    });

    expect(respuesta.status).toBe(400);
  });

  it('responde 404 en una ruta que no existe', async () => {
    expect((await pedir('/no-existe')).status).toBe(404);
  });
});

describe('Seguridad del historial de la clienta', () => {
  it('ya no existe la consulta solo por telefono', async () => {
    expect((await pedir(`/citas?telefono=${TELEFONO_DE_ANA}`)).status).toBe(404);
  });

  it('muestra el historial con telefono y codigo correctos (aunque el codigo venga en minusculas)', async () => {
    const respuesta = await pedir('/citas/consulta', conJson('POST', { telefono: '9999-0000', codigo: 'abcde-23456' }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toHaveLength(1);
  });

  it('con un codigo equivocado responde lista vacia, sin revelar si el telefono existe', async () => {
    const respuesta = await pedir('/citas/consulta', conJson('POST', { telefono: TELEFONO_DE_ANA, codigo: 'ZZZZZ99999' }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual([]);
  });
});

describe('Encabezados de seguridad', () => {
  it('se envian en todas las respuestas', async () => {
    const respuesta = await pedir('/salud');

    expect(respuesta.headers.get('x-content-type-options')).toBe('nosniff');
    expect(respuesta.headers.get('x-frame-options')).toBe('DENY');
    expect(respuesta.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(respuesta.headers.get('x-powered-by')).toBeNull();
  });

  it('el panel no se guarda en cache', async () => {
    const respuesta = await pedir('/panel/clientas', conSesion());

    expect(respuesta.headers.get('cache-control')).toBe('no-store');
  });
});

describe('API del panel (duena)', () => {
  it('rechaza las rutas del panel sin sesion', async () => {
    expect((await pedir('/panel/citas?desde=2026-11-09&hasta=2026-11-15')).status).toBe(401);
  });

  it('rechaza un token falso', async () => {
    expect((await pedir('/panel/clientas', conSesion('falso.token'))).status).toBe(401);
  });

  it('inicia sesion y con ese token entra al panel', async () => {
    const login = await pedir('/auth/login', conJson('POST', { usuario: 'delmy', contrasena: 'correcta' }));
    const { token } = await login.json();

    const respuesta = await pedir('/panel/citas?desde=2026-11-09&hasta=2026-11-15', conSesion(token));

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json())[0].clienta.nombre).toBe('Ana');
  });

  it('responde 401 con credenciales incorrectas', async () => {
    const login = await pedir('/auth/login', conJson('POST', { usuario: 'delmy', contrasena: 'mal' }));

    expect(login.status).toBe(401);
  });

  it('cambia el estado de una cita', async () => {
    const respuesta = await pedir('/panel/citas/5/estado', conJson('PATCH', { estado: 'confirmada' }, tokenNuevo()));

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).estado).toBe('confirmada');
  });

  it('rechaza un estado que no existe', async () => {
    const respuesta = await pedir('/panel/citas/5/estado', conJson('PATCH', { estado: 'borrada' }, tokenNuevo()));

    expect(respuesta.status).toBe(400);
  });

  it('rechaza un rango de fechas al reves', async () => {
    expect((await pedir('/panel/citas?desde=2026-11-15&hasta=2026-11-09', conSesion())).status).toBe(400);
  });

  it('devuelve el historial de una clienta y 404 si no existe', async () => {
    const existente = await pedir('/panel/clientas/7/historial', conSesion());
    const inexistente = await pedir('/panel/clientas/8/historial', conSesion());

    expect(existente.status).toBe(200);
    expect((await existente.json()).citas).toHaveLength(1);
    expect(inexistente.status).toBe(404);
  });
});

describe('API del panel: sesion', () => {
  it('confirma que la sesion sigue valida', async () => {
    const respuesta = await pedir('/panel/sesion', conSesion());

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).nombre).toBe('Delmy');
  });

  it('al cerrar sesion, el mismo token deja de servir', async () => {
    const token = tokenNuevo();

    const cierre = await pedir('/panel/sesion/cerrar', { method: 'POST', ...conSesion(token) });
    const despues = await pedir('/panel/sesion', conSesion(token));

    expect(cierre.status).toBe(204);
    expect(despues.status).toBe(401);
  });
});

describe('API del panel: configuracion del salon', () => {
  it('protege la configuracion con la sesion', async () => {
    expect((await pedir('/panel/servicios')).status).toBe(401);
    expect((await pedir('/panel/horario')).status).toBe(401);
  });

  it('lista todos los servicios, incluidos los pausados', async () => {
    const respuesta = await pedir('/panel/servicios', conSesion());

    expect((await respuesta.json())[0]).toHaveProperty('activo', true);
  });

  it('crea un servicio con los datos que define la duena', async () => {
    const nuevo = { nombre: 'Pedicure spa', precio: 400, duracionMin: 90, categoria: 'Pedicure' };

    const respuesta = await pedir('/panel/servicios', conJson('POST', nuevo, tokenNuevo()));

    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toMatchObject(nuevo);
  });

  it('explica todos los errores de un servicio invalido', async () => {
    const invalido = { nombre: '', precio: -5, duracionMin: 0 };

    const respuesta = await pedir('/panel/servicios', conJson('POST', invalido, tokenNuevo()));

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).errores).toHaveLength(3);
  });

  it('pausa un servicio y responde 404 si no existe', async () => {
    const pausado = await pedir('/panel/servicios/1/activo', conJson('PATCH', { activo: false }, tokenNuevo()));
    const inexistente = await pedir('/panel/servicios/9/activo', conJson('PATCH', { activo: false }, tokenNuevo()));

    expect((await pausado.json()).activo).toBe(false);
    expect(inexistente.status).toBe(404);
  });

  it('avisa que el horario todavia no esta configurado', async () => {
    const respuesta = await pedir('/panel/horario', conSesion());

    expect(await respuesta.json()).toEqual({
      configurado: false,
      zonaHoraria: null,
      intervaloMin: null,
      maxCitasPendientes: null,
      dias: [],
    });
  });

  it('guarda el horario semanal y las reglas que define la duena', async () => {
    const horario = {
      zonaHoraria: 'America/Tegucigalpa',
      intervaloMin: 45,
      maxCitasPendientes: 3,
      dias: [
        { diaSemana: 6, apertura: '08:00', cierre: '13:00' },
        { diaSemana: 1, apertura: '10:00', cierre: '19:30' },
      ],
    };

    const respuesta = await pedir('/panel/horario', conJson('PUT', horario, tokenNuevo()));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      configurado: true,
      zonaHoraria: 'America/Tegucigalpa',
      intervaloMin: 45,
      maxCitasPendientes: 3,
      dias: [
        { diaSemana: 1, apertura: '10:00', cierre: '19:30' },
        { diaSemana: 6, apertura: '08:00', cierre: '13:00' },
      ],
    });
  });

  it('rechaza un horario donde se cierra antes de abrir', async () => {
    const horario = {
      zonaHoraria: 'America/Tegucigalpa',
      intervaloMin: 30,
      maxCitasPendientes: 2,
      dias: [{ diaSemana: 1, apertura: '18:00', cierre: '09:00' }],
    };

    expect((await pedir('/panel/horario', conJson('PUT', horario, tokenNuevo()))).status).toBe(400);
  });
});

describe('API del panel: dias libres y bloqueos', () => {
  it('lista los bloqueos con sus motivos', async () => {
    const respuesta = await pedir('/panel/bloqueos?desde=2026-11-01&hasta=2026-11-30', conSesion());

    expect(await respuesta.json()).toContainEqual({
      id: 2,
      desde: '2026-11-10',
      hasta: '2026-11-10',
      inicio: '12:00',
      fin: '13:00',
      motivo: 'Tramite',
    });
  });

  it('crea un bloqueo de un dia y avisa que citas quedan afectadas', async () => {
    const respuesta = await pedir(
      '/panel/bloqueos',
      conJson('POST', { desde: '2026-11-10', motivo: 'Cita medica' }, tokenNuevo()),
    );
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.bloqueo).toMatchObject({ desde: '2026-11-10', hasta: '2026-11-10', inicio: null, fin: null });
    expect(cuerpo.citasAfectadas[0].clienta.nombre).toBe('Ana');
  });

  it('rechaza un bloqueo con solo hora de inicio', async () => {
    const respuesta = await pedir('/panel/bloqueos', conJson('POST', { desde: '2026-11-10', inicio: '12:00' }, tokenNuevo()));

    expect(respuesta.status).toBe(400);
  });

  it('elimina un bloqueo y responde 404 si no existe', async () => {
    const eliminado = await pedir('/panel/bloqueos/1', { method: 'DELETE', ...conSesion() });
    const inexistente = await pedir('/panel/bloqueos/99', { method: 'DELETE', ...conSesion() });

    expect(eliminado.status).toBe(204);
    expect(inexistente.status).toBe(404);
  });
});

// Va al final: agota el limite de agendar de la IP de las pruebas.
describe('Limite de citas por IP', () => {
  it('responde 429 con Retry-After al pasar el limite', async () => {
    let respuesta = await pedir('/citas', conJson('POST', solicitudValida));
    while (respuesta.status === 201) {
      respuesta = await pedir('/citas', conJson('POST', solicitudValida));
    }

    expect(respuesta.status).toBe(429);
    expect(Number(respuesta.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});
