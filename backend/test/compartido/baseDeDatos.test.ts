// Cortes de conexion con el pool REAL de `pg` y conexiones falsas. Importa que
// el pool sea el real: es el que decide quien escucha los errores en cada
// momento, y un 'error' sin escucha apaga el proceso de Node.

import { EventEmitter } from 'node:events';
import pg from 'pg';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseDeDatosPostgres } from '../../src/compartido/baseDeDatos/baseDeDatos';

type AlTerminar = (error: Error | null, resultado?: unknown) => void;

class ConexionFalsa extends EventEmitter {
  static abiertas: ConexionFalsa[] = [];
  _queryable = true; // lo lee el pool para saber si la conexion sirve
  fallaAlDeshacer = false;
  cerrada = false;
  readonly consultas: string[] = [];

  connect(alTerminar: AlTerminar): void {
    ConexionFalsa.abiertas.push(this);
    process.nextTick(() => alTerminar(null));
  }

  query(sql: string, _valores?: unknown, alTerminar?: AlTerminar): Promise<unknown> | undefined {
    this.consultas.push(sql);
    const falla = !this._queryable || (sql === 'ROLLBACK' && this.fallaAlDeshacer);
    const error = falla ? new Error('la conexion no responde') : null;
    const resultado = { rows: [], rowCount: 0 };
    if (alTerminar) {
      process.nextTick(() => alTerminar(error, resultado));
      return undefined;
    }
    return error ? Promise.reject(error) : Promise.resolve(resultado);
  }

  end(alTerminar?: () => void): void {
    this.cerrada = true;
    alTerminar?.();
  }

  // Igual que `pg` cuando se corta el socket.
  cortar(): void {
    this._queryable = false;
    this.emit('error', new Error('Connection terminated unexpectedly'));
  }
}

let baseDeDatos: BaseDeDatosPostgres;

beforeEach(() => {
  ConexionFalsa.abiertas = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
  baseDeDatos = new BaseDeDatosPostgres(new pg.Pool({ Client: ConexionFalsa } as unknown as pg.PoolConfig));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await baseDeDatos.cerrar();
});

describe('BaseDeDatosPostgres: cortes de conexion', () => {
  it('sobrevive si se corta una conexion en reposo y abre otra', async () => {
    await baseDeDatos.query('SELECT 1');

    expect(() => ConexionFalsa.abiertas[0].cortar()).not.toThrow();

    await expect(baseDeDatos.query('SELECT 2')).resolves.toBeDefined();
    expect(ConexionFalsa.abiertas).toHaveLength(2);
  });

  it('sobrevive si se corta en medio de una transaccion, que falla sin guardarse a medias', async () => {
    // Se anota y se revisa afuera: adentro, el error de la transaccion lo taparia.
    let errorSinEscucha: unknown;
    const transaccion = baseDeDatos.transaccion(async () => {
      try {
        ConexionFalsa.abiertas[0].cortar();
      } catch (error) {
        errorSinEscucha = error; // en produccion esto apaga el proceso
      }
    });

    await expect(transaccion).rejects.toThrow('la conexion no responde');
    expect(errorSinEscucha).toBeUndefined();
    await expect(baseDeDatos.query('SELECT 1')).resolves.toBeDefined();
    expect(ConexionFalsa.abiertas).toHaveLength(2);
  });

  it('si ROLLBACK falla, conserva el error original y descarta esa conexion', async () => {
    const transaccion = baseDeDatos.transaccion(async () => {
      ConexionFalsa.abiertas[0].fallaAlDeshacer = true;
      throw new Error('error original');
    });

    await expect(transaccion).rejects.toThrow('error original');
    expect(ConexionFalsa.abiertas[0].cerrada).toBe(true);
  });

  it('si ROLLBACK funciona, reutiliza la conexion', async () => {
    const transaccion = baseDeDatos.transaccion(async () => {
      throw new Error('hora ocupada');
    });
    await expect(transaccion).rejects.toThrow('hora ocupada');

    await baseDeDatos.query('SELECT 1');

    expect(ConexionFalsa.abiertas).toHaveLength(1);
    expect(ConexionFalsa.abiertas[0].consultas).toEqual(['BEGIN', 'ROLLBACK', 'SELECT 1']);
  });

  it('registra cada corte una vez, como texto y sin los datos de la conexion', async () => {
    await baseDeDatos.query('SELECT 1');

    ConexionFalsa.abiertas[0].cortar();

    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      'Se perdio una conexion con PostgreSQL: Connection terminated unexpectedly',
    );
  });
});
