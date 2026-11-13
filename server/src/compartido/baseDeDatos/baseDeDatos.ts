// Puerto de base de datos. Los repositorios dependen de `Consultor` (solo
// `query`), asi funcionan igual dentro y fuera de una transaccion, y en las
// pruebas se sustituyen por un doble sin PostgreSQL.

import type { Pool, PoolClient } from 'pg';

export type ValorSQL = string | number | boolean | null;

export interface ResultadoConsulta<Fila> {
  rows: Fila[];
  rowCount: number | null;
}

export interface Consultor {
  query<Fila = Record<string, unknown>>(sql: string, valores?: ValorSQL[]): Promise<ResultadoConsulta<Fila>>;
}

export interface BaseDeDatos extends Consultor {
  // Todo lo que pase dentro de `trabajo` se guarda junto o no se guarda.
  transaccion<T>(trabajo: (consultor: Consultor) => Promise<T>): Promise<T>;
  cerrar(): Promise<void>;
}

export class BaseDeDatosPostgres implements BaseDeDatos {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  query<Fila>(sql: string, valores: ValorSQL[] = []): Promise<ResultadoConsulta<Fila>> {
    return consultarCon(this.pool, sql, valores);
  }

  async transaccion<T>(trabajo: (consultor: Consultor) => Promise<T>): Promise<T> {
    const conexion = await this.pool.connect();
    try {
      await conexion.query('BEGIN');
      const resultado = await trabajo(new ConsultorDeTransaccion(conexion));
      await conexion.query('COMMIT');
      return resultado;
    } catch (error) {
      await conexion.query('ROLLBACK');
      throw error;
    } finally {
      conexion.release();
    }
  }

  cerrar(): Promise<void> {
    return this.pool.end();
  }
}

class ConsultorDeTransaccion implements Consultor {
  private readonly conexion: PoolClient;

  constructor(conexion: PoolClient) {
    this.conexion = conexion;
  }

  query<Fila>(sql: string, valores: ValorSQL[] = []): Promise<ResultadoConsulta<Fila>> {
    return consultarCon(this.conexion, sql, valores);
  }
}

// `pg` tipa las filas como `any`; aqui se fija el tipo que espera cada
// repositorio. Es el unico lugar con esa conversion.
async function consultarCon<Fila>(
  origen: Pool | PoolClient,
  sql: string,
  valores: ValorSQL[],
): Promise<ResultadoConsulta<Fila>> {
  const resultado = await origen.query(sql, valores);
  return { rows: resultado.rows as Fila[], rowCount: resultado.rowCount };
}
