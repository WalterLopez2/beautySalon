// Citas guardadas. Lo usan la clienta (agendar, ver su historial) y la duena
// (agenda, cambiar estado). El precio y la duracion se copian del servicio al
// agendar: si manana cambia el precio, las citas viejas no se alteran.

import type { Consultor } from '../baseDeDatos/baseDeDatos';
import { esErrorDePostgres, VIOLACION_DE_EXCLUSION } from '../baseDeDatos/erroresDePostgres';
import { HORA_NO_DISPONIBLE, minutosAHora, type EstadoCita } from '../dominio/citas';
import type { MomentoDelSalon } from '../dominio/horario';
import { Conflicto } from '../errores';

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
  // Lo que escribieron al agendar. Puede no ser el nombre de la ficha: el
  // telefono no se verifica.
  nombreEscrito: string;
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
  nombreEscrito: string;
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
  nombre_escrito: string;
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
         c.estado, c.precio, c.nombre_escrito,
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

  // Evita que dos clientas tomen la misma hora al mismo tiempo: mientras dure
  // la transaccion, nadie mas puede agendar en ese dia. Se libera sola al
  // terminar (COMMIT o ROLLBACK). Solo tiene efecto dentro de una transaccion.
  async bloquearDia(fecha: string): Promise<void> {
    await this.baseDeDatos.query("SELECT pg_advisory_xact_lock(hashtext('citas:' || $1))", [fecha]);
  }

  // El candado del dia no alcanza para el maximo por clienta: dos pedidos del
  // mismo telefono en dias distintos contarian a la vez. Se toma siempre
  // despues del candado del dia, asi dos transacciones no se esperan entre si.
  async bloquearTelefono(telefono: string): Promise<void> {
    await this.baseDeDatos.query("SELECT pg_advisory_xact_lock(hashtext('telefono:' || $1))", [telefono]);
  }

  // Las canceladas y las vencidas no ocupan: liberan su horario.
  async ocupadasEl(fecha: string): Promise<FranjaOcupada[]> {
    const resultado = await this.baseDeDatos.query<{ inicio_min: number; duracion_min: number }>(
      `SELECT inicio_min, duracion_min FROM citas
       WHERE fecha = $1 AND estado NOT IN ('cancelada', 'vencida')
       ORDER BY inicio_min`,
      [fecha],
    );
    return resultado.rows.map((fila) => ({ inicioMin: fila.inicio_min, duracionMin: fila.duracion_min }));
  }

  async crear(cita: NuevaCita): Promise<CitaRegistrada> {
    const id = await this.insertar(cita).catch((error: unknown) => {
      // Ultima barrera: la base no acepta dos citas en la misma hora.
      if (esErrorDePostgres(error, VIOLACION_DE_EXCLUSION)) throw new Conflicto(HORA_NO_DISPONIBLE);
      throw error;
    });
    const creada = await this.obtenerPorId(id);
    if (!creada) {
      throw new Error('No se pudo leer la cita recien creada.');
    }
    return creada;
  }

  private async insertar(cita: NuevaCita): Promise<number> {
    const resultado = await this.baseDeDatos.query<{ id: number }>(
      `INSERT INTO citas
         (cliente_id, servicio_id, fecha, inicio_min, duracion_min, precio, nombre_escrito, codigo_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        cita.clienteId,
        cita.servicioId,
        cita.fecha,
        cita.inicioMin,
        cita.duracionMin,
        cita.precio,
        cita.nombreEscrito,
        cita.codigoHash,
      ],
    );
    return resultado.rows[0].id;
  }

  async obtenerPorId(id: number): Promise<CitaRegistrada | null> {
    const resultado = await this.baseDeDatos.query<FilaCita>(`${SELECCION_COMPLETA} WHERE c.id = $1`, [id]);
    const fila = resultado.rows[0];
    return fila ? aCitaRegistrada(fila) : null;
  }

  // Consulta publica: un codigo abre SOLO la cita con la que se entrego. No
  // puede abrir las demas del telefono, porque al agendar nadie comprueba que
  // el telefono sea de quien lo escribe. Con datos que no coinciden devuelve
  // [], igual que si no hubiera citas.
  async listarPorTelefonoYCodigo(telefono: string, codigoHash: string): Promise<CitaRegistrada[]> {
    return this.listarDonde('cl.telefono = $1 AND c.codigo_hash = $2', [telefono, codigoHash]);
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

  // Solo las que aun no empiezan: si la hora ya llego, la clienta pudo asistir
  // y la duena todavia tiene que poder confirmarla y cobrarla.
  async vencerPendientes(pedidasAntesDe: Date, ahora: MomentoDelSalon): Promise<number> {
    const resultado = await this.baseDeDatos.query(
      `UPDATE citas SET estado = 'vencida'
       WHERE estado = 'pendiente' AND creada_en <= $1
         AND (fecha > $2 OR (fecha = $2 AND inicio_min > $3))`,
      [pedidasAntesDe.toISOString(), ahora.fecha, ahora.minuto],
    );
    return resultado.rowCount ?? 0;
  }

  async listarPorCliente(clienteId: number): Promise<CitaRegistrada[]> {
    return this.listarDonde('c.cliente_id = $1', [clienteId]);
  }

  // De cualquier fecha: el plazo para agendar lo cambia la duena cuando quiera.
  async listarPendientes(): Promise<CitaRegistrada[]> {
    return this.listarDonde("c.estado = 'pendiente'", []);
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
    nombreEscrito: fila.nombre_escrito,
    clienta: {
      id: fila.cliente_id,
      nombre: fila.cliente_nombre,
      telefono: fila.cliente_telefono,
      correo: fila.cliente_correo,
    },
  };
}
