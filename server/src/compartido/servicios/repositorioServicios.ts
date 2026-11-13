// Catalogo de servicios del salon (unas, pestanas, maquillaje...).

import type { Consultor } from '../baseDeDatos/baseDeDatos';

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionMin: number;
  categoria: string | null;
}

export interface DatosServicio {
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionMin: number;
  categoria: string | null;
}

interface FilaServicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string; // NUMERIC llega como texto desde `pg` para no perder centavos
  duracion_min: number;
  categoria: string | null;
}

const COLUMNAS = 'id, nombre, descripcion, precio, duracion_min, categoria';

export class RepositorioServicios {
  private readonly baseDeDatos: Consultor;

  constructor(baseDeDatos: Consultor) {
    this.baseDeDatos = baseDeDatos;
  }

  async crearTabla(): Promise<void> {
    await this.baseDeDatos.query(`
      CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL UNIQUE,
        descripcion TEXT,
        precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
        duracion_min INTEGER NOT NULL CHECK (duracion_min > 0),
        categoria VARCHAR(60),
        activo BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
  }

  // Solo los activos: un servicio pausado no se ofrece a las clientas.
  async listarActivos(): Promise<Servicio[]> {
    const resultado = await this.baseDeDatos.query<FilaServicio>(
      `SELECT ${COLUMNAS} FROM servicios WHERE activo ORDER BY categoria, nombre`,
    );
    return resultado.rows.map(aServicio);
  }

  async obtenerActivoPorId(id: number): Promise<Servicio | null> {
    const resultado = await this.baseDeDatos.query<FilaServicio>(
      `SELECT ${COLUMNAS} FROM servicios WHERE id = $1 AND activo`,
      [id],
    );
    const fila = resultado.rows[0];
    return fila ? aServicio(fila) : null;
  }

  // Crea o actualiza por nombre. Lo usa la semilla de datos.
  async guardar(datos: DatosServicio): Promise<void> {
    await this.baseDeDatos.query(
      `INSERT INTO servicios (nombre, descripcion, precio, duracion_min, categoria)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (nombre) DO UPDATE
       SET descripcion = EXCLUDED.descripcion,
           precio = EXCLUDED.precio,
           duracion_min = EXCLUDED.duracion_min,
           categoria = EXCLUDED.categoria`,
      [datos.nombre, datos.descripcion, datos.precio, datos.duracionMin, datos.categoria],
    );
  }
}

function aServicio(fila: FilaServicio): Servicio {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precio: Number(fila.precio),
    duracionMin: fila.duracion_min,
    categoria: fila.categoria,
  };
}
