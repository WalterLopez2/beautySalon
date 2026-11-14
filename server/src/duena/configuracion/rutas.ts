// Rutas con las que la duena administra su salon: catalogo de servicios y
// horario de atencion. Se montan bajo /panel, ya protegidas por la sesion.

import { Router } from 'express';
import type { HorarioSemanal } from '../../compartido/dominio/horario';
import { aHorarioDeUnDia } from '../../compartido/dominio/horario';
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
  guardarHorario: { ejecutar(horario: HorarioSemanal): Promise<HorarioSemanal> };
}

const SERVICIO_INEXISTENTE = 'El servicio no existe.';

export function crearRutasDeConfiguracion({
  servicios,
  horario,
  guardarHorario,
}: DependenciasDeConfiguracion): Router {
  const rutas = Router();

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

function leerDatosServicio(cuerpo: unknown): DatosServicio {
  const datos = leerObjeto(cuerpo, 'el servicio');
  return leerCampos<DatosServicio>({
    nombre: () => leerTexto(datos.nombre, 'nombre'),
    descripcion: () => leerTextoOpcional(datos.descripcion, 'descripcion'),
    precio: () => leerMonto(datos.precio, 'precio'),
    duracionMin: () => leerEnteroPositivo(datos.duracionMin, 'duracionMin'),
    categoria: () => leerTextoOpcional(datos.categoria, 'categoria'),
  });
}

// Las reglas (dias validos, apertura antes del cierre, zona horaria real...)
// las revisa el caso de uso; aqui solo se comprueban los tipos.
function leerHorarioSemanal(cuerpo: unknown): HorarioSemanal {
  const datos = leerObjeto(cuerpo, 'el horario');
  return leerCampos<HorarioSemanal>({
    configuracion: () =>
      leerCampos({
        zonaHoraria: () => leerTexto(datos.zonaHoraria, 'zonaHoraria'),
        intervaloMin: () => leerEnteroPositivo(datos.intervaloMin, 'intervaloMin'),
        maxCitasPendientes: () => leerEnteroPositivo(datos.maxCitasPendientes, 'maxCitasPendientes'),
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
