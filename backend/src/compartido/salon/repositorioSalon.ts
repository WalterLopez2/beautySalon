// Informacion publica del salon. La lee la pagina de la clienta y la escribe
// la duena desde el panel.

import type { Consultor } from '../baseDeDatos/baseDeDatos';
import type { InformacionDelSalon } from '../dominio/informacionDelSalon';

const COLUMNAS = 'nombre, marca, eslogan, descripcion, telefono';

export class RepositorioSalon {
  private readonly baseDeDatos: Consultor;

  constructor(baseDeDatos: Consultor) {
    this.baseDeDatos = baseDeDatos;
  }

  // null = la duena todavia no la llena.
  async obtener(): Promise<InformacionDelSalon | null> {
    const resultado = await this.baseDeDatos.query<InformacionDelSalon>(`SELECT ${COLUMNAS} FROM informacion_salon`);
    return resultado.rows[0] ?? null;
  }

  async guardar({ nombre, marca, eslogan, descripcion, telefono }: InformacionDelSalon): Promise<InformacionDelSalon> {
    const resultado = await this.baseDeDatos.query<InformacionDelSalon>(
      `INSERT INTO informacion_salon (id, ${COLUMNAS})
       VALUES (TRUE, $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET nombre = EXCLUDED.nombre,
           marca = EXCLUDED.marca,
           eslogan = EXCLUDED.eslogan,
           descripcion = EXCLUDED.descripcion,
           telefono = EXCLUDED.telefono
       RETURNING ${COLUMNAS}`,
      [nombre, marca, eslogan, descripcion, telefono],
    );
    return resultado.rows[0];
  }
}
