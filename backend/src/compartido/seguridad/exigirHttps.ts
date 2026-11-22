// Con SOLO_HTTPS la API no atiende nada que llegue por HTTP plano.
//
// Se rechaza en vez de redirigir para que un cliente mal configurado falle a
// la vista y no siga mandando datos sin cifrar. Lo que ya viajo en esa
// peticion no se puede des-enviar: por eso el hosting ademas debe redirigir
// la pagina a HTTPS, antes de que alguien escriba un dato.
//
// `peticion.secure` sale de X-Forwarded-Proto y solo se cree si viene de un
// proxy de confianza (PROXIES_DE_CONFIANZA).

import type { RequestHandler } from 'express';
import { HttpsRequerido } from '../errores';

export const exigirHttps: RequestHandler = (peticion, _respuesta, siguiente) => {
  if (!peticion.secure) {
    throw new HttpsRequerido();
  }
  siguiente();
};
