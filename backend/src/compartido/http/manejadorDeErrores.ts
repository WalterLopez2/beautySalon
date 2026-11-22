// Ultimo middleware de Express: traduce cada error a una respuesta JSON con
// la forma que espera el frontend: `{ mensaje, errores? }`.
// Los errores inesperados se registran completos pero NUNCA se le muestran al
// usuario (podrian filtrar detalles internos o de la base de datos).

import type { ErrorRequestHandler, RequestHandler } from 'express';
import {
  Conflicto,
  DatosInvalidos,
  DemasiadosIntentos,
  HttpsRequerido,
  NoAutorizado,
  NoEncontrado,
  PeticionNoPermitida,
} from '../errores';

const MENSAJE_GENERICO = 'Ocurrio un error inesperado. Intenta de nuevo en un momento.';
const PETICION_MUY_GRANDE = 'La peticion es demasiado grande.';
const PETICION_ILEGIBLE = 'No se pudo leer la peticion.';

export const rutaNoEncontrada: RequestHandler = (_peticion, respuesta) => {
  respuesta.status(404).json({ mensaje: 'La ruta solicitada no existe.' });
};

export const manejadorDeErrores: ErrorRequestHandler = (error, _peticion, respuesta, _siguiente) => {
  if (error instanceof DatosInvalidos) {
    respuesta.status(400).json({ mensaje: error.message, errores: error.errores });
    return;
  }
  if (error instanceof NoAutorizado) {
    respuesta.status(401).json({ mensaje: error.message });
    return;
  }
  if (error instanceof HttpsRequerido || error instanceof PeticionNoPermitida) {
    respuesta.status(403).json({ mensaje: error.message });
    return;
  }
  if (error instanceof NoEncontrado) {
    respuesta.status(404).json({ mensaje: error.message });
    return;
  }
  if (error instanceof Conflicto) {
    respuesta.status(409).json({ mensaje: error.message });
    return;
  }
  if (error instanceof DemasiadosIntentos) {
    respuesta.set('Retry-After', String(error.segundosParaReintentar));
    respuesta.status(429).json({ mensaje: error.message });
    return;
  }
  if (esJsonMalFormado(error)) {
    respuesta.status(400).json({ mensaje: 'El cuerpo de la peticion no es un JSON valido.' });
    return;
  }

  const estado = estadoDePeticionIlegible(error);
  if (estado !== null) {
    respuesta.status(estado).json({ mensaje: estado === 413 ? PETICION_MUY_GRANDE : PETICION_ILEGIBLE });
    return;
  }

  console.error(error);
  respuesta.status(500).json({ mensaje: MENSAJE_GENERICO });
};

// `express.json()` marca el JSON invalido con `type: 'entity.parse.failed'`.
function esJsonMalFormado(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed';
}

// Express marca con un `status` 4xx lo que no pudo leer (cuerpo muy grande,
// codificacion rara, "%zz" en la direccion): es culpa del pedido, no del servidor.
function estadoDePeticionIlegible(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  const { status } = error;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : null;
}
