// Dias libres y horas bloqueadas. Lo lee la vista publica (para no ofrecer
// esas horas) y lo administra la duena desde el panel.

import type { Consultor } from '../baseDeDatos/baseDeDatos';
import type { Bloqueo, DatosBloqueo } from '../dominio/bloqueos';

interface FilaBloqueo {
  id: number;
  desde: string;
  hasta: string;
  inicio_min: number | null;
  fin_min: number | null;
  motivo: string | null;
}

// `to_char` evita que `pg` convierta DATE a un Date de JS con zona horaria.
const COLUMNAS = `id, to_char(desde, 'YYYY-MM-DD') AS desde, to_char(hasta, 'YYYY-MM-DD') AS hasta,
                  inicio_min, fin_min, motivo`;

export class RepositorioBloqueos {
  private readonly baseDeDatos: Consultor;

  constructor(baseDeDatos: Consultor) {
    this.baseDeDatos = baseDeDatos;
  }

  async crearTabla(): Promise<void> {
    await this.baseDeDatos.query(`
      CREATE TABLE IF NOT EXISTS bloqueos (
        id SERIAL PRIMARY KEY,
        desde DATE NOT NULL,
        hasta DATE NOT NULL,
        inicio_min INTEGER CHECK (inicio_min BETWEEN 0 AND 1439),
        fin_min INTEGER CHECK (fin_min BETWEEN 1 AND 1440),
        motivo VARCHAR(200),
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (desde <= hasta),
        CHECK (
          (inicio_min IS NULL AND fin_min IS NULL) OR
          (inicio_min IS NOT NULL AND fin_min IS NOT NULL AND inicio_min < fin_min)
        )
      )
    `);
    await this.baseDeDatos.query('CREATE INDEX IF NOT EXISTS bloqueos_rango_idx ON bloqueos (desde, hasta)');
  }

  // Los que aplican a una fecha concreta.
  async delDia(fecha: string): Promise<Bloqueo[]> {
    return this.listarDonde('$1 BETWEEN desde AND hasta', [fecha]);
  }

  // Los que se cruzan con el rango [desde, hasta], aunque empiecen antes o
  // terminen despues (por ejemplo, unas vacaciones que atraviesan el mes).
  async entre(desde: string, hasta: string): Promise<Bloqueo[]> {
    return this.listarDonde('desde <= $2 AND hasta >= $1', [desde, hasta]);
  }

  async crear(datos: DatosBloqueo): Promise<Bloqueo> {
    const resultado = await this.baseDeDatos.query<FilaBloqueo>(
      `INSERT INTO bloqueos (desde, hasta, inicio_min, fin_min, motivo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNAS}`,
      [datos.desde, datos.hasta, datos.inicioMin, datos.finMin, datos.motivo],
    );
    return aBloqueo(resultado.rows[0]);
  }

  async eliminar(id: number): Promise<boolean> {
    const resultado = await this.baseDeDatos.query('DELETE FROM bloqueos WHERE id = $1', [id]);
    return resultado.rowCount === 1;
  }

  private async listarDonde(condicion: string, valores: string[]): Promise<Bloqueo[]> {
    const resultado = await this.baseDeDatos.query<FilaBloqueo>(
      `SELECT ${COLUMNAS} FROM bloqueos WHERE ${condicion} ORDER BY desde, inicio_min NULLS FIRST`,
      valores,
    );
    return resultado.rows.map(aBloqueo);
  }
}

function aBloqueo(fila: FilaBloqueo): Bloqueo {
  return {
    id: fila.id,
    desde: fila.desde,
    hasta: fila.hasta,
    inicioMin: fila.inicio_min,
    finMin: fila.fin_min,
    motivo: fila.motivo,
  };
}
