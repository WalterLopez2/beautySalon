// Middleware que protege las rutas del panel: sin un token valido en
// "Authorization: Bearer <token>" responde 401 y la ruta nunca se ejecuta.

import type { RequestHandler } from 'express';
import { NoAutorizado } from '../../compartido/errores';
import type { EmisorDeTokens } from './tokens';

const PREFIJO = 'Bearer ';

export function requiereSesion(tokens: EmisorDeTokens): RequestHandler {
  return (peticion, respuesta, siguiente) => {
    const encabezado = peticion.get('Authorization') ?? '';
    if (!encabezado.startsWith(PREFIJO)) {
      throw new NoAutorizado();
    }

    respuesta.locals.sesion = tokens.verificar(encabezado.slice(PREFIJO.length));
    siguiente();
  };
}
