import { describe, expect, it, vi } from 'vitest';
import type { Consultor, ValorSQL } from '../../src/compartido/baseDeDatos/baseDeDatos';
import { leerMigraciones } from '../../src/compartido/baseDeDatos/leerMigraciones';
import { Migrador, type Migracion } from '../../src/compartido/baseDeDatos/Migrador';

const primera: Migracion = { nombre: '001_primera.sql', sql: 'CREATE TABLE a (id INT);\n' };
const segunda: Migracion = { nombre: '002_segunda.sql', sql: 'CREATE TABLE b (id INT);\n' };

// Una base falsa que recuerda las migraciones anotadas.
function crearBase() {
  const anotadas: { nombre: string; huella: string }[] = [];
  const ejecutadas: string[] = [];
  const query = vi.fn(async (sql: string, valores: ValorSQL[] = []) => {
    ejecutadas.push(sql);
    if (sql.startsWith('INSERT INTO migraciones')) {
      anotadas.push({ nombre: String(valores[0]), huella: String(valores[1]) });
    }
    return { rows: sql.startsWith('SELECT nombre') ? [...anotadas] : [], rowCount: 0 };
  });
  const transacciones = { cantidad: 0 };
  const transaccion = <T>(trabajo: (consultor: Consultor) => Promise<T>): Promise<T> => {
    transacciones.cantidad++;
    return trabajo({ query } as Consultor);
  };

  return { migrador: new Migrador({ transaccion }), ejecutadas, transacciones };
}

describe('Migrador', () => {
  it('aplica las pendientes en orden, aunque lleguen desordenadas', async () => {
    const { migrador } = crearBase();

    expect(await migrador.aplicar([segunda, primera])).toEqual([primera.nombre, segunda.nombre]);
  });

  it('no repite las que ya aplico', async () => {
    const { migrador, ejecutadas } = crearBase();
    await migrador.aplicar([primera]);

    expect(await migrador.aplicar([primera, segunda])).toEqual([segunda.nombre]);
    expect(ejecutadas.filter((sql) => sql === primera.sql)).toHaveLength(1);
  });

  it('se detiene si alguien edito una ya aplicada', async () => {
    const { migrador, ejecutadas } = crearBase();
    await migrador.aplicar([primera]);
    const editada = { ...primera, sql: 'DROP TABLE a;' };

    await expect(migrador.aplicar([editada, segunda])).rejects.toThrow('cambio despues de aplicarse');
    expect(ejecutadas).not.toContain(segunda.sql);
  });

  it('se detiene si falta el archivo de una ya aplicada', async () => {
    const { migrador } = crearBase();
    await migrador.aplicar([primera]);

    await expect(migrador.aplicar([segunda])).rejects.toThrow('Falta el archivo');
  });

  it('un cambio de fin de linea (Windows o Linux) no cuenta como edicion', async () => {
    const { migrador } = crearBase();
    await migrador.aplicar([primera]);

    await expect(migrador.aplicar([{ ...primera, sql: primera.sql.replace('\n', '\r\n') }])).resolves.toEqual([]);
  });

  it('hace todo en una sola transaccion y toma el candado antes que nada', async () => {
    const { migrador, ejecutadas, transacciones } = crearBase();

    await migrador.aplicar([primera, segunda]);

    expect(transacciones.cantidad).toBe(1);
    expect(ejecutadas[0]).toContain('pg_advisory_xact_lock');
  });
});

describe('archivos de backend/migraciones', () => {
  it('tienen numeros seguidos, sin repetir', async () => {
    const numeros = (await leerMigraciones()).map(({ nombre }) => Number(nombre.slice(0, 3)));

    expect(numeros.length).toBeGreaterThan(0);
    expect(numeros).toEqual(numeros.map((_, indice) => indice + 1));
  });

  it('la primera crea todas las tablas del sistema', async () => {
    const [{ sql }] = await leerMigraciones();

    for (const tabla of ['clientes', 'servicios', 'citas', 'configuracion_salon', 'horario_semanal', 'bloqueos', 'usuarias']) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${tabla} (`);
    }
  });
});
