// Rutas con las que la duena administra su salon: informacion publica,
// catalogo de servicios y horario con sus reglas. Se montan bajo /panel, ya protegidas por la sesion.

import { Router } from 'express';
import type { HorarioSemanal } from '../../compartido/dominio/horario';
import { aHorarioDeUnDia } from '../../compartido/dominio/horario';
import { prepararInformacion, type InformacionDelSalon } from '../../compartido/dominio/informacionDelSalon';
import { DURACION_MAXIMA, LARGO_MAXIMO } from '../../compartido/dominio/limitesDeDatos';
import { NoEncontrado } from '../../compartido/errores';
import {
  leerBooleano,
  leerCampos,
  leerEnteroPositivo,
  leerHora,
  leerIdentificador,
  leerLista,
  leerMonto,
  leerObjeto,
  leerTexto,
  leerTextoOpcional,
} from '../../compartido/http/entrada';
import type { DatosServicio, ServicioDelPanel } from '../../compartido/servicios/repositorioServicios';
import { aHorarioSemanalDTO } from './presentacion';

export interface DependenciasDeConfiguracion {
  servicios: {
    listarTodos(): Promise<ServicioDelPanel[]>;
    crear(datos: DatosServicio): Promise<ServicioDelPanel>;
    actualizar(id: number, datos: DatosServicio): Promise<ServicioDelPanel | null>;
    cambiarActivo(id: number, activo: boolean): Promise<ServicioDelPanel | null>;
  };
  horario: { obtenerSemanal(): Promise<HorarioSemanal | null> };
  salon: {
    obtener(): Promise<InformacionDelSalon | null>;
    guardar(informacion: InformacionDelSalon): Promise<InformacionDelSalon>;
  };
  guardarHorario: { ejecutar(horario: HorarioSemanal): Promise<HorarioSemanal> };
}

const SERVICIO_INEXISTENTE = 'El servicio no existe.';

export function crearRutasDeConfiguracion({
  servicios,
  horario,
  salon,
  guardarHorario,
}: DependenciasDeConfiguracion): Router {
  const rutas = Router();

  // ----- Informacion publica del salon -----

  rutas.get('/salon', async (_peticion, respuesta) => {
    respuesta.json(await salon.obtener());
  });

  rutas.put('/salon', async (peticion, respuesta) => {
    respuesta.json(await salon.guardar(prepararInformacion(leerInformacion(peticion.body))));
  });

  // ----- Catalogo de servicios -----

  rutas.get('/servicios', async (_peticion, respuesta) => {
    respuesta.json(await servicios.listarTodos());
  });

  rutas.post('/servicios', async (peticion, respuesta) => {
    respuesta.status(201).json(await servicios.crear(leerDatosServicio(peticion.body)));
  });

  rutas.put('/servicios/:id', async (peticion, respuesta) => {
    const id = leerIdentificador(peticion.params.id, 'id');
    respuesta.json(existente(await servicios.actualizar(id, leerDatosServicio(peticion.body))));
  });

  // Pausar o reactivar: un servicio pausado deja de ofrecerse a las clientas.
  rutas.patch('/servicios/:id/activo', async (peticion, respuesta) => {
    const id = leerIdentificador(peticion.params.id, 'id');
    const activo = leerBooleano(leerObjeto(peticion.body, 'el cambio').activo, 'activo');
    respuesta.json(existente(await servicios.cambiarActivo(id, activo)));
  });

  // ----- Horario de atencion -----

  rutas.get('/horario', async (_peticion, respuesta) => {
    respuesta.json(aHorarioSemanalDTO(await horario.obtenerSemanal()));
  });

  rutas.put('/horario', async (peticion, respuesta) => {
    const guardado = await guardarHorario.ejecutar(leerHorarioSemanal(peticion.body));
    respuesta.json(aHorarioSemanalDTO(guardado));
  });

  return rutas;
}

function existente(servicio: ServicioDelPanel | null): ServicioDelPanel {
  if (!servicio) {
    throw new NoEncontrado(SERVICIO_INEXISTENTE);
  }
  return servicio;
}

function leerInformacion(cuerpo: unknown): InformacionDelSalon {
  const datos = leerObjeto(cuerpo, 'el salon');
  return leerCampos<InformacionDelSalon>({
    nombre: () => leerTexto(datos.nombre, 'nombre', LARGO_MAXIMO.nombreDelSalon),
    marca: () => leerTextoOpcional(datos.marca, 'marca', LARGO_MAXIMO.marca),
    eslogan: () => leerTextoOpcional(datos.eslogan, 'eslogan', LARGO_MAXIMO.eslogan),
    descripcion: () => leerTextoOpcional(datos.descripcion, 'descripcion', LARGO_MAXIMO.descripcionDelSalon),
    telefono: () => leerTextoOpcional(datos.telefono, 'telefono', LARGO_MAXIMO.telefono),
  });
}

function leerDatosServicio(cuerpo: unknown): DatosServicio {
  const datos = leerObjeto(cuerpo, 'el servicio');
  return leerCampos<DatosServicio>({
    nombre: () => leerTexto(datos.nombre, 'nombre', LARGO_MAXIMO.nombre),
    descripcion: () => leerTextoOpcional(datos.descripcion, 'descripcion', LARGO_MAXIMO.descripcion),
    precio: () => leerMonto(datos.precio, 'precio'),
    duracionMin: () => leerEnteroPositivo(datos.duracionMin, 'duracionMin', DURACION_MAXIMA),
    categoria: () => leerTextoOpcional(datos.categoria, 'categoria', LARGO_MAXIMO.categoria),
  });
}

// Las reglas (dias validos, apertura antes del cierre, zona horaria real...)
// las revisa el caso de uso; aqui solo se comprueban los tipos.
function leerHorarioSemanal(cuerpo: unknown): HorarioSemanal {
  const datos = leerObjeto(cuerpo, 'el horario');
  return leerCampos<HorarioSemanal>({
    configuracion: () =>
      leerCampos({
        zonaHoraria: () => leerTexto(datos.zonaHoraria, 'zonaHoraria', LARGO_MAXIMO.zonaHoraria),
        intervaloMin: () => leerEnteroPositivo(datos.intervaloMin, 'intervaloMin'),
        maxCitasPendientes: () => leerEnteroPositivo(datos.maxCitasPendientes, 'maxCitasPendientes'),
        diasDeAnticipacion: () => leerEnteroPositivo(datos.diasDeAnticipacion, 'diasDeAnticipacion'),
        horasParaConfirmar: () => leerEnteroPositivo(datos.horasParaConfirmar, 'horasParaConfirmar'),
        citasPorConexionAlDia: () => leerEnteroPositivo(datos.citasPorConexionAlDia, 'citasPorConexionAlDia'),
      }),
    dias: () =>
      leerLista(datos.dias, 'dias').map((crudo) => {
        const dia = leerObjeto(crudo, 'un dia del horario');
        return aHorarioDeUnDia(
          leerEnteroPositivo(dia.diaSemana, 'diaSemana'),
          leerHora(dia.apertura, 'apertura'),
          leerHora(dia.cierre, 'cierre'),
        );
      }),
  });
}
