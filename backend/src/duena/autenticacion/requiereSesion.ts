// Middleware que protege las rutas del panel: sin una cookie con un token
// valido (firmado, sin vencer y no revocado) responde 401 y la ruta nunca se
// ejecuta.

import type { RequestHandler, Response } from 'express';
import { NoAutorizado } from '../../compartido/errores';
import type { CookieDeSesion } from './cookieDeSesion';
import type { SesionDeDuena } from './tokens';

export interface VerificadorDeSesion {
  ejecutar(token: string): Promise<SesionDeDuena>;
}

export function requiereSesion(verificador: VerificadorDeSesion, cookie: CookieDeSesion): RequestHandler {
  return async (peticion, respuesta, siguiente) => {
    const token = cookie.leer(peticion);
    if (!token) {
      throw new NoAutorizado();
    }

    respuesta.locals.sesion = await verificador.ejecutar(token);
    siguiente();
  };
}

// Solo se usa en rutas montadas detras de `requiereSesion`.
export function sesionActual(respuesta: Response): SesionDeDuena {
  return respuesta.locals.sesion as SesionDeDuena;
}
