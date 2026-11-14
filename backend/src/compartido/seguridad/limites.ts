// Limites de seguridad de la API, todos juntos para ajustarlos en un solo
// lugar. Son proteccion tecnica contra abuso (bots, fuerza bruta), no reglas
// del negocio: las reglas del salon las configura la duena en el panel.

import type { ReglaDeLimite } from './LimitadorDeIntentos';

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;

export const LIMITES = {
  // Fallos de login con el mismo usuario desde la misma IP.
  loginPorUsuario: { intentos: 5, ventanaMs: 15 * MINUTO },
  // Fallos de login desde una IP, sin importar el usuario (evita probar
  // muchas cuentas distintas).
  loginPorIp: { intentos: 20, ventanaMs: 15 * MINUTO },
  // Citas que se pueden pedir desde una misma IP.
  agendarPorIp: { intentos: 10, ventanaMs: HORA },
  // Consultas de historial con codigo (evita adivinar codigos).
  consultarHistorialPorIp: { intentos: 20, ventanaMs: 15 * MINUTO },
} satisfies Record<string, ReglaDeLimite>;
