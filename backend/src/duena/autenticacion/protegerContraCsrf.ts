// CSRF: otro sitio intenta que el navegador de la duena haga un pedido con su
// cookie. Otro sitio no puede agregar un encabezado propio sin permiso (CORS),
// y esta API no da ese permiso. Se suma a SameSite=Strict, que no cubre a un
// subdominio vecino.

import type { RequestHandler } from 'express';
import { PeticionNoPermitida } from '../../compartido/errores';

// Lo agrega `clienteHttp.ts` del frontend.
const ENCABEZADO_DEL_FRONTEND = 'X-Salon-Peticion';
const METODOS_DE_SOLO_LECTURA = ['GET', 'HEAD', 'OPTIONS'];

export const protegerContraCsrf: RequestHandler = (peticion, _respuesta, siguiente) => {
  if (!METODOS_DE_SOLO_LECTURA.includes(peticion.method) && !peticion.get(ENCABEZADO_DEL_FRONTEND)) {
    throw new PeticionNoPermitida();
  }
  siguiente();
};
