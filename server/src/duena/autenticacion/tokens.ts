// Tokens de sesion firmados con HMAC-SHA256: "<contenido>.<firma>", ambos en
// base64url. Sin la clave secreta del servidor nadie puede fabricar uno ni
// cambiar su contenido (por ejemplo, alargar el vencimiento).

import { createHmac, timingSafeEqual } from 'node:crypto';
import { NoAutorizado } from '../../compartido/errores';

export interface SesionDeDuena {
  usuariaId: number;
  nombre: string;
  expiraEn: number; // milisegundos desde 1970 (Date.now())
}

export interface TokenEmitido {
  token: string;
  expiraEn: Date;
}

const SESION_INVALIDA = 'Tu sesion no es valida o ya vencio. Inicia sesion de nuevo.';

export class EmisorDeTokens {
  private readonly secreto: string;
  private readonly duracionMs: number;
  private readonly ahora: () => number;

  constructor(secreto: string, duracionMs: number, ahora: () => number = Date.now) {
    this.secreto = secreto;
    this.duracionMs = duracionMs;
    this.ahora = ahora;
  }

  emitir(usuariaId: number, nombre: string): TokenEmitido {
    const sesion: SesionDeDuena = { usuariaId, nombre, expiraEn: this.ahora() + this.duracionMs };
    const contenido = Buffer.from(JSON.stringify(sesion)).toString('base64url');
    return { token: `${contenido}.${this.firmar(contenido)}`, expiraEn: new Date(sesion.expiraEn) };
  }

  verificar(token: string): SesionDeDuena {
    const [contenido, firma, sobrante] = token.split('.');
    if (!contenido || !firma || sobrante !== undefined || !this.firmaCoincide(contenido, firma)) {
      throw new NoAutorizado(SESION_INVALIDA);
    }

    const sesion = leerSesion(contenido);
    if (!sesion || sesion.expiraEn <= this.ahora()) {
      throw new NoAutorizado(SESION_INVALIDA);
    }
    return sesion;
  }

  private firmar(contenido: string): string {
    return createHmac('sha256', this.secreto).update(contenido).digest('base64url');
  }

  private firmaCoincide(contenido: string, firma: string): boolean {
    const esperada = Buffer.from(this.firmar(contenido));
    const recibida = Buffer.from(firma);
    return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
  }
}

function leerSesion(contenido: string): SesionDeDuena | null {
  try {
    const sesion = JSON.parse(Buffer.from(contenido, 'base64url').toString('utf8')) as Partial<SesionDeDuena>;
    const esValida =
      typeof sesion.usuariaId === 'number' &&
      typeof sesion.nombre === 'string' &&
      typeof sesion.expiraEn === 'number';
    return esValida ? (sesion as SesionDeDuena) : null;
  } catch {
    return null;
  }
}
