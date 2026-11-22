// Con SOLO_HTTPS la API no atiende nada por HTTP plano, salvo la revision de
// salud del hosting. Se prueba por HTTP real con una base de datos falsa.

import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { crearApp, type OpcionesDeLaApp } from '../../src/app';
import type { BaseDeDatos } from '../../src/compartido/baseDeDatos/baseDeDatos';
import type { Configuracion } from '../../src/configuracion';
import { crearDependencias } from '../../src/contenedor';

const CONFIGURACION = {
  secretoDeTokens: 'una-clave-secreta-de-pruebas-de-32-caracteres',
  duracionDeSesionMs: 60_000,
} as Configuracion;

const DETRAS_DE_UN_PROXY: OpcionesDeLaApp = { soloHttps: true, proxiesDeConfianza: 1 };
const POR_HTTPS = { 'X-Forwarded-Proto': 'https' };
const POR_HTTP = { 'X-Forwarded-Proto': 'http' };

let servidor: Server | undefined;

afterEach(() => {
  servidor?.close();
});

async function levantar(opciones: OpcionesDeLaApp) {
  const query = vi.fn(async () => ({ rows: [], rowCount: 0 }));
  const baseDeDatos = { query } as unknown as BaseDeDatos;
  servidor = crearApp(crearDependencias(baseDeDatos, CONFIGURACION), opciones).listen(0, '127.0.0.1');
  await new Promise((listo) => servidor?.once('listening', listo));
  const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/api`;

  return { query, pedir: (ruta: string, inicio: RequestInit = {}) => fetch(`${base}${ruta}`, inicio) };
}

describe('SOLO_HTTPS', () => {
  it.each([
    ['GET', '/servicios'],
    ['GET', '/citas/agenda?fecha=2026-12-01'],
    ['POST', '/citas'],
    ['POST', '/citas/consulta'],
    ['POST', '/auth/login'],
    ['GET', '/panel/clientas'],
  ])('rechaza %s %s por HTTP sin tocar la base de datos', async (method, ruta) => {
    const { pedir, query } = await levantar(DETRAS_DE_UN_PROXY);

    const respuesta = await pedir(ruta, { method, headers: POR_HTTP });

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ mensaje: 'Esta API solo funciona por HTTPS.' });
    expect(query).not.toHaveBeenCalled();
  });

  it('rechaza antes de leer el cuerpo', async () => {
    const { pedir } = await levantar(DETRAS_DE_UN_PROXY);

    const respuesta = await pedir('/auth/login', {
      method: 'POST',
      headers: { ...POR_HTTP, 'Content-Type': 'application/json' },
      body: '{esto no es json',
    });

    expect(respuesta.status).toBe(403); // si lo hubiera leido seria 400
  });

  it('rechaza si el proxy no dice que protocolo se uso', async () => {
    const { pedir } = await levantar(DETRAS_DE_UN_PROXY);

    expect((await pedir('/servicios')).status).toBe(403);
  });

  it('no cree en X-Forwarded-Proto si no hay un proxy de confianza', async () => {
    const { pedir } = await levantar({ soloHttps: true, proxiesDeConfianza: 0 });

    expect((await pedir('/servicios', { headers: POR_HTTPS })).status).toBe(403);
  });

  it('atiende lo que llega por HTTPS', async () => {
    const { pedir } = await levantar(DETRAS_DE_UN_PROXY);

    expect((await pedir('/servicios', { headers: POR_HTTPS })).status).toBe(200);
  });

  it('deja la revision de salud disponible por HTTP', async () => {
    const { pedir } = await levantar(DETRAS_DE_UN_PROXY);

    expect((await pedir('/salud', { headers: POR_HTTP })).status).toBe(200);
  });

  it('apagado (tu computadora), atiende por HTTP', async () => {
    const { pedir } = await levantar({ soloHttps: false });

    expect((await pedir('/servicios')).status).toBe(200);
  });
});
