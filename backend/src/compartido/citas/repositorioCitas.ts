// Citas guardadas. Lo usan la clienta (agendar, ver su historial) y la duena
// (agenda, cambiar estado). El precio y la duracion se copian del servicio al
// agendar: si manana cambia el precio, las citas viejas no se alteran.

import type { Consultor } from '../baseDeDatos/baseDeDatos';
import { minutosAHora, type EstadoCita } from '../dominio/citas';

export interface ClientaDeLaCita {
  id: number;
  nombre: string;
  telefono: string;
  correo: string | null;
}

export interface CitaRegistrada {
  id: number;
  servicioId: number;
  servicioNombre: string;
  fecha: string; // YYYY-MM-DD
  inicio: string; // HH:MM
  duracionMin: number;
  estado: EstadoCita;
  precio: number;
  clienta: ClientaDeLaCita;
}

export interface FranjaOcupada {
  inicioMin: number;
  duracionMin: number;
}

export interface NuevaCita {
  clienteId: number;
  servicioId: number;
  fecha: string;
  inicioMin: number;
  duracionMin: number;
  precio: number;
  codigoHash: string; // hash del codigo de consulta que recibe la clienta
}

interface FilaCita {
  id: number;
  servicio_id: number;
  servicio_nombre: string;
  fecha: string;
  inicio_min: number;
  duracion_min: number;
  estado: EstadoCita;
  precio: string;
  cliente_id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_correo: string | null;
}

// `to_char` evita que `pg` convierta DATE a un Date de JS con zona horaria
// (en Honduras correria la fecha un dia).
const SELECCION_COMPLETA = `
  SELECT c.id, c.servicio_id, s.nombre AS servicio_nombre,
         to_char(c.fecha, 'YYYY-MM-DD') AS fecha, c.inicio_min, c.duracion_min,
         c.estado, c.precio,
         cl.id AS cliente_id, cl.nombre AS cliente_nombre,
         cl.telefono AS cliente_telefono, cl.correo AS cliente_correo
  FROM citas c
  JOIN servicios s ON s.id = c.servicio_id
  JOIN clientes cl ON cl.id = c.cliente_id
`;

const ORDEN_CRONOLOGICO = 'ORDER BY c.fecha, c.inicio_min';

export class RepositorioCitas {
  private readonly baseDeDatos: Consultor;

  constructor(baseDeDatos: Consultor) {
    this.baseDeDatos = baseDeDatos;
  }

  async crearTabla(): Promise<void> {
    await this.baseDeDatos.query(`
      CREATE TABLE IF NOT EXISTS citas (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER NOT NULL REFERENCES clientes (id),
        servicio_id INTEGER NOT NULL REFERENCES servicios (id),
        fecha DATE NOT NULL,
        inicio_min INTEGER NOT NULL CHECK (inicio_min BETWEEN 0 AND 1439),
        duracion_min INTEGER NOT NULL CHECK (duracion_min > 0),
        precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
        estado VARCHAR(12) NOT NULL DEFAULT 'pendiente'
          CHECK (estado IN ('pendiente', 'confirmada', 'atendida', 'cancelada')),
        codigo_hash CHAR(64) NOT NULL,
        creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.baseDeDatos.query('CREATE INDEX IF NOT EXISTS citas_fecha_idx ON citas (fecha)');
    await this.baseDeDatos.query('CREATE INDEX IF NOT EXISTS citas_cliente_idx ON citas (cliente_id)');
  }

  // Evita que dos clientas tomen la misma hora al mismo tiempo: mientras dure
  // la transaccion, nadie mas puede agendar en ese dia. Se libera sola al
  // terminar (COMMIT o ROLLBACK). Solo tiene efecto dentro de una transaccion.
  async bloquearDia(fecha: string): Promise<void> {
    await this.baseDeDatos.query("SELECT pg_advisory_xact_lock(hashtext('citas:' || $1))", [fecha]);
  }

  // Las canceladas no ocupan: liberan su horario.
  async ocupadasEl(fecha: string): Promise<FranjaOcupada[]> {
    const resultado = await this.baseDeDatos.query<{ inicio_min: number; duracion_min: number }>(
      `SELECT inicio_min, duracion_min FROM citas
       WHERE fecha = $1 AND estado <> 'cancelada'
       ORDER BY inicio_min`,
      [fecha],
    );
    return resultado.rows.map((fila) => ({ inicioMin: fila.inicio_min, duracionMin: fila.duracion_min }));
  }

  async crear(cita: NuevaCita): Promise<CitaRegistrada> {
    const resultado = await this.baseDeDatos.query<{ id: number }>(
      `INSERT INTO citas (cliente_id, servicio_id, fecha, inicio_min, duracion_min, precio, codigo_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [cita.clienteId, cita.servicioId, cita.fecha, cita.inicioMin, cita.duracionMin, cita.precio, cita.codigoHash],
    );
    const creada = await this.obtenerPorId(resultado.rows[0].id);
    if (!creada) {
      throw new Error('No se pudo leer la cita recien creada.');
    }
    return creada;
  }

  async obtenerPorId(id: number): Promise<CitaRegistrada | null> {
    const resultado = await this.baseDeDatos.query<FilaCita>(`${SELECCION_COMPLETA} WHERE c.id = $1`, [id]);
    const fila = resultado.rows[0];
    return fila ? aCitaRegistrada(fila) : null;
  }

  // Historial de la clienta, solo si el codigo coincide con alguna de SUS
  // citas. Con un telefono ajeno o un codigo inventado devuelve [], igual que
  // si no tuviera citas: no revela si el telefono existe.
  async listarPorTelefonoYCodigo(telefono: string, codigoHash: string): Promise<CitaRegistrada[]> {
    return this.listarDonde(
      `cl.telefono = $1 AND EXISTS (
         SELECT 1 FROM citas propia WHERE propia.cliente_id = cl.id AND propia.codigo_hash = $2
       )`,
      [telefono, codigoHash],
    );
  }

  // Citas que la clienta todavia tiene por delante (para limitar reservas).
  async contarVigentesPorTelefono(telefono: string, desdeFecha: string): Promise<number> {
    const resultado = await this.baseDeDatos.query<{ cantidad: string }>(
      `SELECT COUNT(*) AS cantidad FROM citas c JOIN clientes cl ON cl.id = c.cliente_id
       WHERE cl.telefono = $1 AND c.fecha >= $2 AND c.estado IN ('pendiente', 'confirmada')`,
      [telefono, desdeFecha],
    );
    return Number(resultado.rows[0].cantidad);
  }

  async listarPorCliente(clienteId: number): Promise<CitaRegistrada[]> {
    return this.listarDonde('c.cliente_id = $1', [clienteId]);
  }

  // Rango cerrado [desde, hasta].
  async listarEntre(desde: string, hasta: string): Promise<CitaRegistrada[]> {
    return this.listarDonde('c.fecha BETWEEN $1 AND $2', [desde, hasta]);
  }

  // Solo cambia si la cita sigue en el estado `desde`. Si otra persona la
  // cambio mientras tanto, no se pisa su cambio y devuelve false.
  async cambiarEstado(id: number, desde: EstadoCita, hacia: EstadoCita): Promise<boolean> {
    const resultado = await this.baseDeDatos.query(
      'UPDATE citas SET estado = $1 WHERE id = $2 AND estado = $3',
      [hacia, id, desde],
    );
    return resultado.rowCount === 1;
  }

  private async listarDonde(condicion: string, valores: (string | number)[]): Promise<CitaRegistrada[]> {
    const resultado = await this.baseDeDatos.query<FilaCita>(
      `${SELECCION_COMPLETA} WHERE ${condicion} ${ORDEN_CRONOLOGICO}`,
      valores,
    );
    return resultado.rows.map(aCitaRegistrada);
  }
}

function aCitaRegistrada(fila: FilaCita): CitaRegistrada {
  return {
    id: fila.id,
    servicioId: fila.servicio_id,
    servicioNombre: fila.servicio_nombre,
    fecha: fila.fecha,
    inicio: minutosAHora(fila.inicio_min),
    duracionMin: fila.duracion_min,
    estado: fila.estado,
    precio: Number(fila.precio),
    clienta: {
      id: fila.cliente_id,
      nombre: fila.cliente_nombre,
      telefono: fila.cliente_telefono,
      correo: fila.cliente_correo,
    },
  };
}
