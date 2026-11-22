// La sesion de la duena viaja en una cookie que el navegador maneja solo:
// - HttpOnly: JavaScript no puede leerla, asi que un script no se la roba;
// - Path: solo se manda a la API del panel, nunca a la vista publica;
// - SameSite=Strict: no se manda desde otros sitios;
// - Secure: con SOLO_HTTPS solo viaja cifrada.

import type { CookieOptions, Request, Response } from 'express';

const NOMBRE = 'sesionDuena';
// El navegador solo acepta este prefijo en cookies Secure puestas por HTTPS.
const PREFIJO_SEGURO = '__Secure-';

export interface OpcionesDeLaCookie {
  ruta: string; // "/api/panel"
  segura: boolean;
}

export class CookieDeSesion {
  private readonly nombre: string;
  private readonly opciones: CookieOptions;

  constructor({ ruta, segura }: OpcionesDeLaCookie) {
    this.nombre = segura ? `${PREFIJO_SEGURO}${NOMBRE}` : NOMBRE;
    this.opciones = { httpOnly: true, secure: segura, sameSite: 'strict', path: ruta };
  }

  guardar(respuesta: Response, token: string, expiraEn: string): void {
    respuesta.cookie(this.nombre, token, { ...this.opciones, expires: new Date(expiraEn) });
  }

  leer(peticion: Request): string | null {
    const inicio = `${this.nombre}=`;
    const cookie = (peticion.get('Cookie') ?? '')
      .split(';')
      .map((parte) => parte.trim())
      .find((parte) => parte.startsWith(inicio));
    return cookie?.slice(inicio.length) || null;
  }

  borrar(respuesta: Response): void {
    respuesta.clearCookie(this.nombre, this.opciones);
  }
}
