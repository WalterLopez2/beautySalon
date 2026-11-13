// Cuentas con acceso al panel (por ahora, la duena). Se llama "usuarias" y no
// "clientes" para que nunca se confundan los datos de acceso con los de las
// clientas del salon.

import type { Consultor } from '../../compartido/baseDeDatos/baseDeDatos';

export interface Usuaria {
  id: number;
  usuario: string;
  nombre: string;
  hashContrasena: string;
}

interface FilaUsuaria {
  id: number;
  usuario: string;
  nombre: string;
  hash_contrasena: string;
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
        creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  // El usuario no distingue mayusculas: "Delmy" y "delmy" son la misma cuenta.
  async buscarPorUsuario(usuario: string): Promise<Usuaria | null> {
    const resultado = await this.baseDeDatos.query<FilaUsuaria>(
      'SELECT id, usuario, nombre, hash_contrasena FROM usuarias WHERE usuario = $1',
      [usuario.trim().toLowerCase()],
    );
    const fila = resultado.rows[0];
    return fila
      ? { id: fila.id, usuario: fila.usuario, nombre: fila.nombre, hashContrasena: fila.hash_contrasena }
      : null;
  }

  // Crea la cuenta o, si ya existe, le cambia el nombre y la contrasena.
  async guardar(usuario: string, nombre: string, hashContrasena: string): Promise<void> {
    await this.baseDeDatos.query(
      `INSERT INTO usuarias (usuario, nombre, hash_contrasena)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario) DO UPDATE
       SET nombre = EXCLUDED.nombre, hash_contrasena = EXCLUDED.hash_contrasena`,
      [usuario.trim().toLowerCase(), nombre.trim(), hashContrasena],
    );
  }
}
