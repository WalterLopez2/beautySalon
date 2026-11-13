// Prueba la API de punta a punta por HTTP, con dobles en lugar de PostgreSQL.

import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import type { CitaRegistrada } from '../src/compartido/citas/repositorioCitas';
import { Cliente } from '../src/compartido/clientes/repositorioClientes';
import { NoAutorizado } from '../src/compartido/errores';
import { EmisorDeTokens } from '../src/duena/autenticacion/tokens';

const tokens = new EmisorDeTokens('una-clave-secreta-de-pruebas-de-32-caracteres', 60 * 60 * 1000);
const TOKEN_VALIDO = tokens.emitir(1, 'Delmy').token;

const cita: CitaRegistrada = {
  id: 5,
  servicioId: 1,
  servicioNombre: 'Manicura',
  fecha: '2026-11-10',
  inicio: '10:00',
  duracionMin: 60,
  estado: 'pendiente',
  precio: 250,
  clienta: { id: 7, nombre: 'Ana', telefono: '99990000', correo: null },
};

const app = crearApp({
  clienta: {
    servicios: { listarActivos: async () => [] },
    citas: {
      ocupadasEl: async () => [{ inicioMin: 600, duracionMin: 60 }],
      listarPorTelefono: async () => [cita],
    },
    agendarCita: { ejecutar: async () => cita },
  },
  duena: {
    tokens,
    iniciarSesion: {
      ejecutar: async ({ contrasena }) => {
        if (contrasena !== 'correcta') throw new NoAutorizado('Usuario o contrasena incorrectos.');
        return { token: TOKEN_VALIDO, nombre: 'Delmy', expiraEn: new Date().toISOString() };
      },
    },
    cambiarEstadoDeCita: { ejecutar: async (_id, estado) => ({ ...cita, estado }) },
    citas: { listarEntre: async () => [cita], listarPorCliente: async () => [cita] },
    clientes: {
      listar: async () => [],
      obtenerPorId: async (id) => (id === 7 ? new Cliente(7, 'Ana', '99990000', null, new Date()) : null),
    },
  },
});

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

describe('API publica (clienta)', () => {
  it('responde la agenda sin datos de las clientas', async () => {
    const respuesta = await pedir('/citas/agenda?fecha=2026-11-10');

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      fecha: '2026-11-10',
      ocupadas: [{ inicio: '10:00', duracionMin: 60 }],
    });
  });

  it('agenda una cita y no devuelve los datos de contacto', async () => {
    const respuesta = await pedir(
      '/citas',
      conJson('POST', {
        servicioId: 1,
        fecha: '2026-11-10',
        inicio: '10:00',
        contacto: { nombre: 'Ana', telefono: '9999-0000', correo: null },
      }),
    );

    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).not.toHaveProperty('clienta');
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

describe('API del panel (duena)', () => {
  it('rechaza las rutas del panel sin sesion', async () => {
    const respuesta = await pedir('/panel/citas?desde=2026-11-09&hasta=2026-11-15');

    expect(respuesta.status).toBe(401);
  });

  it('rechaza un token falso', async () => {
    const respuesta = await pedir('/panel/clientas', { headers: { Authorization: 'Bearer falso.token' } });

    expect(respuesta.status).toBe(401);
  });

  it('inicia sesion y con ese token entra al panel', async () => {
    const login = await pedir('/auth/login', conJson('POST', { usuario: 'delmy', contrasena: 'correcta' }));
    const { token } = await login.json();

    const respuesta = await pedir('/panel/citas?desde=2026-11-09&hasta=2026-11-15', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json())[0].clienta.nombre).toBe('Ana');
  });

  it('responde 401 con credenciales incorrectas', async () => {
    const login = await pedir('/auth/login', conJson('POST', { usuario: 'delmy', contrasena: 'mal' }));

    expect(login.status).toBe(401);
  });

  it('cambia el estado de una cita', async () => {
    const respuesta = await pedir('/panel/citas/5/estado', conJson('PATCH', { estado: 'confirmada' }, TOKEN_VALIDO));

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).estado).toBe('confirmada');
  });

  it('rechaza un estado que no existe', async () => {
    const respuesta = await pedir('/panel/citas/5/estado', conJson('PATCH', { estado: 'borrada' }, TOKEN_VALIDO));

    expect(respuesta.status).toBe(400);
  });

  it('rechaza un rango de fechas al reves', async () => {
    const respuesta = await pedir('/panel/citas?desde=2026-11-15&hasta=2026-11-09', {
      headers: { Authorization: `Bearer ${TOKEN_VALIDO}` },
    });

    expect(respuesta.status).toBe(400);
  });

  it('devuelve el historial de una clienta y 404 si no existe', async () => {
    const autorizacion = { headers: { Authorization: `Bearer ${TOKEN_VALIDO}` } };

    const existente = await pedir('/panel/clientas/7/historial', autorizacion);
    const inexistente = await pedir('/panel/clientas/8/historial', autorizacion);

    expect(existente.status).toBe(200);
    expect((await existente.json()).citas).toHaveLength(1);
    expect(inexistente.status).toBe(404);
  });
});
