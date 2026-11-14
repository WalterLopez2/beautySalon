// Middleware que protege las rutas del panel: sin un token valido (firmado,
// sin vencer y no revocado) en "Authorization: Bearer <token>" responde 401
// y la ruta nunca se ejecuta.

import type { RequestHandler, Response } from 'express';
import { NoAutorizado } from '../../compartido/errores';
import type { SesionDeDuena } from './tokens';

const PREFIJO = 'Bearer ';

export interface VerificadorDeSesion {
  ejecutar(token: string): Promise<SesionDeDuena>;
}

export function requiereSesion(verificador: VerificadorDeSesion): RequestHandler {
  return async (peticion, respuesta, siguiente) => {
    const encabezado = peticion.get('Authorization') ?? '';
    if (!encabezado.startsWith(PREFIJO)) {
      throw new NoAutorizado();
    }

    respuesta.locals.sesion = await verificador.ejecutar(encabezado.slice(PREFIJO.length));
    siguiente();
  };
}

// Solo se usa en rutas montadas detras de `requiereSesion`.
export function sesionActual(respuesta: Response): SesionDeDuena {
  return respuesta.locals.sesion as SesionDeDuena;
}
