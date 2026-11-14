// Arma la aplicacion de Express a partir de sus dependencias. No abre puertos
// ni se conecta a la base de datos: por eso se puede probar con dobles.

import express, { type Express } from 'express';
import { crearRutasDeLaClienta, type DependenciasDeLaClienta } from './clienta/rutas';
import { manejadorDeErrores, rutaNoEncontrada } from './compartido/http/manejadorDeErrores';
import { cabecerasDeSeguridad } from './compartido/seguridad/cabecerasDeSeguridad';
import { crearRutasDeLaDuena, type DependenciasDeLaDuena } from './duena/rutas';

export interface DependenciasDeLaApp {
  clienta: DependenciasDeLaClienta;
  duena: DependenciasDeLaDuena;
}

export interface OpcionesDeLaApp {
  // Cuantos proxies hay delante (hosting, balanceador). Sin esto, detras de un
  // proxy todas las peticiones parecen venir de la misma IP y los limites por
  // IP bloquearian a todo el mundo a la vez.
  proxiesDeConfianza?: number;
  // En produccion (HTTPS) se pide al navegador no volver a usar HTTP.
  soloHttps?: boolean;
}

// Coincide con `URL_DE_LA_API` del frontend.
const PREFIJO_DE_LA_API = '/api';

export function crearApp(
  { clienta, duena }: DependenciasDeLaApp,
  { proxiesDeConfianza = 0, soloHttps = false }: OpcionesDeLaApp = {},
): Express {
  const app = express();

  app.disable('x-powered-by'); // no anunciar la tecnologia del servidor
  app.set('trust proxy', proxiesDeConfianza);
  app.use(cabecerasDeSeguridad({ soloHttps }));
  app.use(express.json({ limit: '10kb' })); // ningun pedido legitimo pesa mas

  app.get(`${PREFIJO_DE_LA_API}/salud`, (_peticion, respuesta) => {
    respuesta.json({ estado: 'ok' });
  });
  app.use(PREFIJO_DE_LA_API, crearRutasDeLaClienta(clienta));
  app.use(PREFIJO_DE_LA_API, crearRutasDeLaDuena(duena));

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);
  return app;
}
