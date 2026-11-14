// Configuracion del salon y su horario semanal, tal como los guardo la duena.
// Mientras no configure nada, el salon se considera cerrado: no se puede
// agendar hasta que ella defina su horario.

import type { Consultor } from '../baseDeDatos/baseDeDatos';
import type {
  ConfiguracionDelSalon,
  HorarioDeUnDia,
  HorarioDelDia,
  HorarioSemanal,
} from '../dominio/horario';

interface FilaConfiguracion {
  zona_horaria: string;
  intervalo_min: number;
  max_citas_pendientes: number;
}

interface FilaHorario {
  dia_semana: number;
  apertura_min: number;
  cierre_min: number;
}

export class RepositorioHorario {
  private readonly baseDeDatos: Consultor;

  constructor(baseDeDatos: Consultor) {
    this.baseDeDatos = baseDeDatos;
  }

  async crearTablas(): Promise<void> {
    // Una sola fila: la llave siempre es TRUE.
    await this.baseDeDatos.query(`
      CREATE TABLE IF NOT EXISTS configuracion_salon (
        id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
        zona_horaria VARCHAR(64) NOT NULL,
        intervalo_min INTEGER NOT NULL CHECK (intervalo_min BETWEEN 5 AND 240),
        max_citas_pendientes INTEGER NOT NULL CHECK (max_citas_pendientes BETWEEN 1 AND 50)
      )
    `);
    await this.baseDeDatos.query(`
      CREATE TABLE IF NOT EXISTS horario_semanal (
        dia_semana SMALLINT PRIMARY KEY CHECK (dia_semana BETWEEN 1 AND 7),
        apertura_min INTEGER NOT NULL CHECK (apertura_min BETWEEN 0 AND 1439),
        cierre_min INTEGER NOT NULL CHECK (cierre_min BETWEEN 1 AND 1440),
        CHECK (apertura_min < cierre_min)
      )
    `);
  }

  async obtenerConfiguracion(): Promise<ConfiguracionDelSalon | null> {
    const resultado = await this.baseDeDatos.query<FilaConfiguracion>(
      'SELECT zona_horaria, intervalo_min, max_citas_pendientes FROM configuracion_salon',
    );
    const fila = resultado.rows[0];
    return fila
      ? {
          zonaHoraria: fila.zona_horaria,
          intervaloMin: fila.intervalo_min,
          maxCitasPendientes: fila.max_citas_pendientes,
        }
      : null;
  }

  // null = ese dia el salon no abre.
  async horarioDelDia(diaSemana: number): Promise<HorarioDelDia | null> {
    const resultado = await this.baseDeDatos.query<FilaHorario>(
      'SELECT dia_semana, apertura_min, cierre_min FROM horario_semanal WHERE dia_semana = $1',
      [diaSemana],
    );
    const fila = resultado.rows[0];
    return fila ? aHorarioDeUnDia(fila) : null;
  }

  async obtenerSemanal(): Promise<HorarioSemanal | null> {
    const configuracion = await this.obtenerConfiguracion();
    if (!configuracion) return null;

    const resultado = await this.baseDeDatos.query<FilaHorario>(
      'SELECT dia_semana, apertura_min, cierre_min FROM horario_semanal ORDER BY dia_semana',
    );
    return { configuracion, dias: resultado.rows.map(aHorarioDeUnDia) };
  }

  // Reemplaza todo el horario. Debe correr dentro de una transaccion para que
  // nunca quede a medias (por ejemplo, sin dias despues del DELETE).
  async guardarSemanal({ configuracion, dias }: HorarioSemanal): Promise<void> {
    await this.baseDeDatos.query(
      `INSERT INTO configuracion_salon (id, zona_horaria, intervalo_min, max_citas_pendientes)
       VALUES (TRUE, $1, $2, $3)
       ON CONFLICT (id) DO UPDATE
       SET zona_horaria = EXCLUDED.zona_horaria,
           intervalo_min = EXCLUDED.intervalo_min,
           max_citas_pendientes = EXCLUDED.max_citas_pendientes`,
      [configuracion.zonaHoraria, configuracion.intervaloMin, configuracion.maxCitasPendientes],
    );
    await this.baseDeDatos.query('DELETE FROM horario_semanal');
    for (const dia of dias) {
      await this.baseDeDatos.query(
        'INSERT INTO horario_semanal (dia_semana, apertura_min, cierre_min) VALUES ($1, $2, $3)',
        [dia.diaSemana, dia.aperturaMin, dia.cierreMin],
      );
    }
  }
}

function aHorarioDeUnDia(fila: FilaHorario): HorarioDeUnDia {
  return { diaSemana: fila.dia_semana, aperturaMin: fila.apertura_min, cierreMin: fila.cierre_min };
}
