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
    tolerarConexionesPerdidas(pool);
  }

  query<Fila>(sql: string, valores: ValorSQL[] = []): Promise<ResultadoConsulta<Fila>> {
    return consultarCon(this.pool, sql, valores);
  }

  async transaccion<T>(trabajo: (consultor: Consultor) => Promise<T>): Promise<T> {
    const conexion = await this.pool.connect();
    let sePuedeReutilizar = true;
    try {
      await conexion.query('BEGIN');
      const resultado = await trabajo(new ConsultorDeTransaccion(conexion));
      await conexion.query('COMMIT');
      return resultado;
    } catch (error) {
      sePuedeReutilizar = await deshacer(conexion);
      throw error;
    } finally {
      conexion.release(!sePuedeReutilizar); // true = descartarla
    }
  }

  cerrar(): Promise<void> {
    return this.pool.end();
  }
}

// En Node un evento 'error' sin escucha apaga el proceso, y `pg` lo emite en
// dos lugares cuando se corta una conexion:
// - en la conexion, siempre. Mientras esta en una transaccion el pool no la
//   escucha, por eso se escucha cada conexion desde que se crea;
// - en el pool, ademas, si estaba en reposo. Ese es el mismo corte ya
//   registrado, asi que no se vuelve a registrar.
// No hace falta reconectar: el pool descarta la conexion y abre otra.
function tolerarConexionesPerdidas(pool: Pool): void {
  pool.on('connect', (conexion) => {
    conexion.on('error', registrarConexionPerdida);
  });
  pool.on('error', () => {});
}

// Solo el mensaje: el error completo de `pg` trae los datos de la conexion.
function registrarConexionPerdida(error: Error): void {
  console.error(`Se perdio una conexion con PostgreSQL: ${error.message}`);
}

// false = no se pudo deshacer y la conexion ya no es confiable. No lanza, para
// no tapar el error que hizo fallar la transaccion. PostgreSQL deshace solo lo
// pendiente cuando esa conexion se cierra.
async function deshacer(conexion: PoolClient): Promise<boolean> {
  try {
    await conexion.query('ROLLBACK');
    return true;
  } catch {
    return false;
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
