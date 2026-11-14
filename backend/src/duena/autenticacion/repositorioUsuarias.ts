// Cuentas con acceso al panel (por ahora, la duena). Se llama "usuarias" y no
// "clientes" para que nunca se confundan los datos de acceso con los de las
// clientas del salon.

import type { Consultor } from '../../compartido/baseDeDatos/baseDeDatos';

export interface Usuaria {
  id: number;
  usuario: string;
  nombre: string;
  hashContrasena: string;
  versionSesion: number;
}

interface FilaUsuaria {
  id: number;
  usuario: string;
  nombre: string;
  hash_contrasena: string;
  version_sesion: number;
}

export class RepositorioUsuarias {
  private readonly baseDeDatos: Consultor;

  constructor(baseDeDatos: Consultor) {
    this.baseDeDatos = baseDeDatos;
  }

  async crearTabla(): Promise<void> {
    await this.baseDeDatos.query(`
      CREATE TABLE IF NOT EXISTS usuarias (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(60) NOT NULL UNIQUE,
        nombre VARCHAR(120) NOT NULL,
        hash_contrasena TEXT NOT NULL,
        version_sesion INTEGER NOT NULL DEFAULT 0,
        creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  // El usuario no distingue mayusculas: "Delmy" y "delmy" son la misma cuenta.
  async buscarPorUsuario(usuario: string): Promise<Usuaria | null> {
    const resultado = await this.baseDeDatos.query<FilaUsuaria>(
      'SELECT id, usuario, nombre, hash_contrasena, version_sesion FROM usuarias WHERE usuario = $1',
      [usuario.trim().toLowerCase()],
    );
    const fila = resultado.rows[0];
    return fila
      ? {
          id: fila.id,
          usuario: fila.usuario,
          nombre: fila.nombre,
          hashContrasena: fila.hash_contrasena,
          versionSesion: fila.version_sesion,
        }
      : null;
  }

  // null si la cuenta ya no existe (sus tokens tampoco deben servir).
  async versionDeSesion(id: number): Promise<number | null> {
    const resultado = await this.baseDeDatos.query<{ version_sesion: number }>(
      'SELECT version_sesion FROM usuarias WHERE id = $1',
      [id],
    );
    return resultado.rows[0]?.version_sesion ?? null;
  }

  // Invalida TODOS los tokens emitidos hasta ahora para esta cuenta.
  async revocarSesiones(id: number): Promise<void> {
    await this.baseDeDatos.query('UPDATE usuarias SET version_sesion = version_sesion + 1 WHERE id = $1', [id]);
  }

  // Crea la cuenta o, si ya existe, le cambia el nombre y la contrasena. Al
  // cambiar la contrasena se cierran todas las sesiones abiertas.
  async guardar(usuario: string, nombre: string, hashContrasena: string): Promise<void> {
    await this.baseDeDatos.query(
      `INSERT INTO usuarias (usuario, nombre, hash_contrasena)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario) DO UPDATE
       SET nombre = EXCLUDED.nombre,
           hash_contrasena = EXCLUDED.hash_contrasena,
           version_sesion = usuarias.version_sesion + 1`,
      [usuario.trim().toLowerCase(), nombre.trim(), hashContrasena],
    );
  }
}
