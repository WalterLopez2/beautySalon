// Rutas de dias libres y horas bloqueadas. Se montan bajo /panel, ya
// protegidas por la sesion.

import { Router } from 'express';
import { horaAMinutos, minutosAHora } from '../../compartido/dominio/citas';
import type { Bloqueo, DatosBloqueo } from '../../compartido/dominio/bloqueos';
import { NoEncontrado } from '../../compartido/errores';
import {
  leerCampos,
  leerFecha,
  leerHoraOpcional,
  leerIdentificador,
  leerObjeto,
  leerRangoDeFechas,
  leerTextoOpcional,
} from '../../compartido/http/entrada';
import { aCitaDelPanel } from '../presentacion';
import type { BloqueoCreado } from './CrearBloqueo';

// Suficiente para ver un ano de vacaciones y feriados de una vez.
const DIAS_MAXIMOS_POR_CONSULTA = 366;

export interface DependenciasDeBloqueos {
  bloqueos: {
    entre(desde: string, hasta: string): Promise<Bloqueo[]>;
    eliminar(id: number): Promise<boolean>;
  };
  crearBloqueo: { ejecutar(datos: DatosBloqueo): Promise<BloqueoCreado> };
}

export function crearRutasDeBloqueos({ bloqueos, crearBloqueo }: DependenciasDeBloqueos): Router {
  const rutas = Router();

  rutas.get('/bloqueos', async (peticion, respuesta) => {
    const { desde, hasta } = leerRangoDeFechas(peticion.query.desde, peticion.query.hasta, DIAS_MAXIMOS_POR_CONSULTA);
    respuesta.json((await bloqueos.entre(desde, hasta)).map(aBloqueoDTO));
  });

  rutas.post('/bloqueos', async (peticion, respuesta) => {
    const { bloqueo, citasAfectadas } = await crearBloqueo.ejecutar(leerDatosBloqueo(peticion.body));
    respuesta.status(201).json({
      bloqueo: aBloqueoDTO(bloqueo),
      citasAfectadas: citasAfectadas.map(aCitaDelPanel),
    });
  });

  rutas.delete('/bloqueos/:id', async (peticion, respuesta) => {
    const id = leerIdentificador(peticion.params.id, 'id');
    if (!(await bloqueos.eliminar(id))) {
      throw new NoEncontrado('El bloqueo no existe.');
    }
    respuesta.status(204).end();
  });

  return rutas;
}

function aBloqueoDTO(bloqueo: Bloqueo) {
  return {
    id: bloqueo.id,
    desde: bloqueo.desde,
    hasta: bloqueo.hasta,
    inicio: bloqueo.inicioMin === null ? null : minutosAHora(bloqueo.inicioMin),
    fin: bloqueo.finMin === null ? null : minutosAHora(bloqueo.finMin),
    motivo: bloqueo.motivo,
  };
}

// `hasta` es opcional: sin el, el bloqueo es de un solo dia. Las reglas
// (rango valido, inicio antes del fin...) las revisa el caso de uso.
function leerDatosBloqueo(cuerpo: unknown): DatosBloqueo {
  const datos = leerObjeto(cuerpo, 'el bloqueo');
  const { desde, hasta, inicio, fin, motivo } = leerCampos({
    desde: () => leerFecha(datos.desde, 'desde'),
    hasta: () => (datos.hasta === undefined ? null : leerFecha(datos.hasta, 'hasta')),
    inicio: () => leerHoraOpcional(datos.inicio, 'inicio'),
    fin: () => leerHoraOpcional(datos.fin, 'fin'),
    motivo: () => leerTextoOpcional(datos.motivo, 'motivo'),
  });

  return {
    desde,
    hasta: hasta ?? desde,
    inicioMin: inicio === null ? null : horaAMinutos(inicio),
    finMin: fin === null ? null : horaAMinutos(fin),
    motivo,
  };
}
