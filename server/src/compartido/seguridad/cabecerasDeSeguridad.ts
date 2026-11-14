// Encabezados de seguridad para todas las respuestas de la API. Son los mismos
// que pondria la libreria "helmet", escritos a mano porque la API solo
// devuelve JSON y asi no se agrega una dependencia.

import type { RequestHandler } from 'express';

export function cabecerasDeSeguridad({ soloHttps }: { soloHttps: boolean }): RequestHandler {
  return (_peticion, respuesta, siguiente) => {
    // La API no sirve HTML: si alguien la abre en el navegador, no se ejecuta nada.
    respuesta.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    respuesta.set('X-Content-Type-Options', 'nosniff'); // no adivinar el tipo de contenido
    respuesta.set('X-Frame-Options', 'DENY'); // no se puede meter en un <iframe>
    respuesta.set('Referrer-Policy', 'no-referrer');
    respuesta.set('Cross-Origin-Resource-Policy', 'same-origin');
    if (soloHttps) {
      // En produccion, el navegador solo volvera a hablar con la API por HTTPS.
      respuesta.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    siguiente();
  };
}

// Los datos del panel (clientas, telefonos, ingresos) no deben quedar
// guardados en la cache del navegador ni de proxies intermedios.
export const sinCache: RequestHandler = (_peticion, respuesta, siguiente) => {
  respuesta.set('Cache-Control', 'no-store');
  siguiente();
};
