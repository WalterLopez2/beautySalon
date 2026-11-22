// De que equipo y de que red viene una IP, para contar intentos.
//
// En IPv6 una sola persona recibe trillones de direcciones (un /64) y a veces
// miles de /64 (un /48): contar por direccion exacta no limita nada.

import { isIPv4, isIPv6 } from 'node:net';

export interface OrigenDeRed {
  equipo: string; // la IPv4, o el /64 en IPv6
  red?: string; // el /48, solo en IPv6
}

// Lo que no es una IP comparte un solo cupo: inventar textos no da cupos nuevos.
const DESCONOCIDO: OrigenDeRed = { equipo: 'desconocido' };
const GRUPOS_DE_IPV6 = 8;
const GRUPOS_DEL_EQUIPO = 4; // 64 bits
const GRUPOS_DE_LA_RED = 3; // 48 bits
const PREFIJO_DE_IPV4_EN_IPV6 = '0:0:0:0:0:ffff';

export function origenDeRed(ip: string): OrigenDeRed {
  if (isIPv4(ip)) return { equipo: ip };

  const [direccion] = ip.split('%'); // sin la interfaz ("%eth0")
  if (!isIPv6(direccion)) return DESCONOCIDO;

  const grupos = gruposDeIPv6(direccion);
  if (grupos.slice(0, 6).join(':') === PREFIJO_DE_IPV4_EN_IPV6) {
    return { equipo: aIPv4(grupos.slice(6)) };
  }
  return {
    equipo: `${grupos.slice(0, GRUPOS_DEL_EQUIPO).join(':')}::/64`,
    red: `${grupos.slice(0, GRUPOS_DE_LA_RED).join(':')}::/48`,
  };
}

// URL deja la direccion en su forma canonica (minusculas, sin ceros a la
// izquierda, sin parte decimal); solo queda expandir el "::".
function gruposDeIPv6(direccion: string): string[] {
  const canonica = new URL(`http://[${direccion}]`).hostname.slice(1, -1);
  const [inicio, fin = ''] = canonica.split('::');
  const antes = inicio ? inicio.split(':') : [];
  const despues = fin ? fin.split(':') : [];
  const ceros = Array<string>(GRUPOS_DE_IPV6 - antes.length - despues.length).fill('0');
  return [...antes, ...ceros, ...despues];
}

function aIPv4(grupos: string[]): string {
  return grupos
    .map((grupo) => parseInt(grupo, 16))
    .flatMap((valor) => [valor >> 8, valor & 0xff])
    .join('.');
}
