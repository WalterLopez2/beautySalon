import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { CookieDeSesion } from '../../src/duena/autenticacion/cookieDeSesion';

const VENCE = '2026-11-23T08:00:00.000Z';

describe('CookieDeSesion', () => {
  it('con HTTPS es Secure, HttpOnly, Strict y solo del panel', () => {
    const cookie = vi.fn();

    new CookieDeSesion({ ruta: '/api/panel', segura: true }).guardar({ cookie } as unknown as Response, 'a.b', VENCE);

    expect(cookie).toHaveBeenCalledWith('__Secure-sesionDuena', 'a.b', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api/panel',
      expires: new Date(VENCE),
    });
  });

  it.each([
    ['sesionDuena=a.b', 'a.b'],
    ['otra=1; sesionDuena=a.b; tercera=2', 'a.b'],
    ['otrasesionDuena=x', null],
    ['sesionDuena=', null],
    ['', null],
  ])('de "%s" lee %s', (encabezado, esperado) => {
    const peticion = { get: () => encabezado } as unknown as Request;

    expect(new CookieDeSesion({ ruta: '/api/panel', segura: false }).leer(peticion)).toBe(esperado);
  });
});
