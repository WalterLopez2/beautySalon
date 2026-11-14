// Catalogo de servicios. Lo administra la duena desde el panel; la pagina
// publica solo ve los activos.
//
// Los servicios no se borran: se pausan. Una cita vieja apunta a su servicio,
// y borrarlo romperia el historial y los reportes de ingresos.

import type { Consultor } from '../baseDeDatos/baseDeDatos';
import { Conflicto } from '../errores';

export interface DatosServicio {
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionMin: number;
  categoria: string | null;
}

export interface Servicio extends DatosServicio {
  id: number;
}

export interface ServicioDelPanel extends Servicio {
  activo: boolean;
}

interface FilaServicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string; // NUMERIC llega como texto desde `pg` para no perder centavos
  duracion_min: number;
  categoria: string | null;
  activo: boolean;
}

const COLUMNAS = 'id, nombre, descripcion, precio, duracion_min, categoria, activo';
const VIOLACION_DE_UNICIDAD = '23505'; // codigo de error de PostgreSQL

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

  // ----- Vista publica -----

  async listarActivos(): Promise<Servicio[]> {
    const resultado = await this.baseDeDatos.query<FilaServicio>(
      `SELECT ${COLUMNAS} FROM servicios WHERE activo ORDER BY categoria, nombre`,
    );
    return resultado.rows.map(aServicioPublico);
  }

  async obtenerActivoPorId(id: number): Promise<Servicio | null> {
    const resultado = await this.baseDeDatos.query<FilaServicio>(
      `SELECT ${COLUMNAS} FROM servicios WHERE id = $1 AND activo`,
      [id],
    );
    const fila = resultado.rows[0];
    return fila ? aServicioPublico(fila) : null;
  }

  // ----- Panel de la duena -----

  async listarTodos(): Promise<ServicioDelPanel[]> {
    const resultado = await this.baseDeDatos.query<FilaServicio>(
      `SELECT ${COLUMNAS} FROM servicios ORDER BY categoria, nombre`,
    );
    return resultado.rows.map(aServicioDelPanel);
  }

  async crear(datos: DatosServicio): Promise<ServicioDelPanel> {
    const resultado = await this.conNombreUnico(() =>
      this.baseDeDatos.query<FilaServicio>(
        `INSERT INTO servicios (nombre, descripcion, precio, duracion_min, categoria)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${COLUMNAS}`,
        [datos.nombre, datos.descripcion, datos.precio, datos.duracionMin, datos.categoria],
      ),
    );
    return aServicioDelPanel(resultado.rows[0]);
  }

  // Cambiar el precio no afecta las citas ya agendadas: guardan su propio precio.
  async actualizar(id: number, datos: DatosServicio): Promise<ServicioDelPanel | null> {
    const resultado = await this.conNombreUnico(() =>
      this.baseDeDatos.query<FilaServicio>(
        `UPDATE servicios
         SET nombre = $1, descripcion = $2, precio = $3, duracion_min = $4, categoria = $5
         WHERE id = $6
         RETURNING ${COLUMNAS}`,
        [datos.nombre, datos.descripcion, datos.precio, datos.duracionMin, datos.categoria, id],
      ),
    );
    const fila = resultado.rows[0];
    return fila ? aServicioDelPanel(fila) : null;
  }

  async cambiarActivo(id: number, activo: boolean): Promise<ServicioDelPanel | null> {
    const resultado = await this.baseDeDatos.query<FilaServicio>(
      `UPDATE servicios SET activo = $1 WHERE id = $2 RETURNING ${COLUMNAS}`,
      [activo, id],
    );
    const fila = resultado.rows[0];
    return fila ? aServicioDelPanel(fila) : null;
  }

  // Traduce el error de nombre repetido de PostgreSQL a un mensaje claro.
  private async conNombreUnico<T>(consulta: () => Promise<T>): Promise<T> {
    try {
      return await consulta();
    } catch (error) {
      if (esViolacionDeUnicidad(error)) {
        throw new Conflicto('Ya existe un servicio con ese nombre.');
      }
      throw error;
    }
  }
}

function esViolacionDeUnicidad(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === VIOLACION_DE_UNICIDAD;
}

function aServicioPublico(fila: FilaServicio): Servicio {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precio: Number(fila.precio),
    duracionMin: fila.duracion_min,
    categoria: fila.categoria,
  };
}

function aServicioDelPanel(fila: FilaServicio): ServicioDelPanel {
  return { ...aServicioPublico(fila), activo: fila.activo };
}
