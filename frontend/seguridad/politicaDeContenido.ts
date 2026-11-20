// Content-Security-Policy de la pagina: le dice al navegador de donde puede
// cargar scripts, estilos, imagenes y a donde puede hacer peticiones. Si algun
// dia entrara un script malicioso (XSS), el navegador se negaria a ejecutarlo
// o a mandar datos a otro servidor; eso protege el token de la duena y los
// datos de las clientas.
//
// La pagina no usa nada externo (ni fuentes ni scripts de terceros), asi que
// la politica es estricta: solo lo que viene del propio sitio.

import type { Plugin } from 'vite'

type Directivas = Record<string, readonly string[]>

const PROPIO_SITIO = "'self'"
const NADA = "'none'"

export function crearPoliticaDeContenido(urlDeLaApi: string): string {
  const directivas: Directivas = {
    'default-src': [PROPIO_SITIO],
    'script-src': [PROPIO_SITIO],
    'style-src': [PROPIO_SITIO],
    'img-src': [PROPIO_SITIO, 'data:'], // Vite incrusta imagenes chicas como data:
    'font-src': [PROPIO_SITIO],
    'connect-src': [PROPIO_SITIO, ...origenDeLaApi(urlDeLaApi)],
    'object-src': [NADA], // sin plugins (Flash, applets)
    'base-uri': [PROPIO_SITIO], // nadie puede cambiar la base de los enlaces
    'form-action': [PROPIO_SITIO],
  }

  return [
    ...Object.entries(directivas).map(([nombre, fuentes]) => `${nombre} ${fuentes.join(' ')}`),
    'upgrade-insecure-requests', // cualquier http:// se pide como https://
  ].join('; ')
}

// Una URL relativa ("/api") ya es del propio sitio. Si la API vive en otro
// dominio, se permite solo ese origen. Una URL mal escrita detiene el build.
function origenDeLaApi(urlDeLaApi: string): string[] {
  if (urlDeLaApi.startsWith('/')) return []
  return [new URL(urlDeLaApi).origin]
}

// Se aplica solo al compilar: en desarrollo Vite inyecta scripts en linea para
// recargar al instante, y una politica estricta los bloquearia.
export function politicaDeContenido(urlDeLaApi: string): Plugin {
  return {
    name: 'politica-de-contenido',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        // Al principio del <head>: la politica solo protege lo que viene despues.
        injectTo: 'head-prepend',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: crearPoliticaDeContenido(urlDeLaApi),
        },
      },
    ],
  }
}
