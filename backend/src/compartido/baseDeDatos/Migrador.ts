// Aplica los cambios de la base en orden y anota cuales ya hizo (tabla
// `migraciones`). Es como git, pero para las tablas:
//
// - todo o nada: corre en una sola transaccion;
// - de a una: un candado evita que dos procesos migren a la vez;
// - no se editan: de cada una se guarda su huella. Para corregir una ya
//   aplicada se crea otra con el numero siguiente.

import { createHash } from 'node:crypto';
import type { BaseDeDatos, Consultor } from './baseDeDatos';

export interface Migracion {
  nombre: string; // "002_telefonos_normalizados.sql": el numero da el orden
  sql: string;
}

interface MigracionAnotada {
  nombre: string;
  huella: string;
}

export class Migrador {
  private readonly baseDeDatos: Pick<BaseDeDatos, 'transaccion'>;

  constructor(baseDeDatos: Pick<BaseDeDatos, 'transaccion'>) {
    this.baseDeDatos = baseDeDatos;
  }

  // Devuelve los nombres de las que aplico ahora.
  async aplicar(migraciones: readonly Migracion[]): Promise<string[]> {
    return this.baseDeDatos.transaccion(async (consultor) => {
      await consultor.query("SELECT pg_advisory_xact_lock(hashtext('migraciones'))");
      const anotadas = await leerAnotadas(consultor);
      exigirQueNoCambiaron(anotadas, migraciones);

      const yaAplicadas = new Set(anotadas.map(({ nombre }) => nombre));
      const pendientes = migraciones
        .filter(({ nombre }) => !yaAplicadas.has(nombre))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      for (const { nombre, sql } of pendientes) {
        await consultor.query(sql);
        await consultor.query('INSERT INTO migraciones (nombre, huella) VALUES ($1, $2)', [nombre, huellaDe(sql)]);
      }
      return pendientes.map(({ nombre }) => nombre);
    });
  }
}

async function leerAnotadas(consultor: Consultor): Promise<MigracionAnotada[]> {
  await consultor.query(`
    CREATE TABLE IF NOT EXISTS migraciones (
      nombre VARCHAR(120) PRIMARY KEY,
      huella CHAR(64) NOT NULL,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  return (await consultor.query<MigracionAnotada>('SELECT nombre, huella FROM migraciones')).rows;
}

function exigirQueNoCambiaron(anotadas: readonly MigracionAnotada[], archivos: readonly Migracion[]): void {
  for (const { nombre, huella } of anotadas) {
    const archivo = archivos.find((migracion) => migracion.nombre === nombre);
    if (!archivo) {
      throw new Error(`Falta el archivo de la migracion ${nombre}, que esta base ya aplico.`);
    }
    if (huellaDe(archivo.sql) !== huella) {
      throw new Error(`La migracion ${nombre} cambio despues de aplicarse. Crea una nueva en vez de editarla.`);
    }
  }
}

// Git cambia los fines de linea entre Windows y Linux: no cuentan como cambio.
function huellaDe(sql: string): string {
  return createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex');
}
