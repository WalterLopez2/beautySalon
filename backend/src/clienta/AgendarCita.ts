// Caso de uso: una clienta pide una cita desde la pagina publica.
//
// Todo pasa dentro de una transaccion con el dia bloqueado: revisar que la
// hora este libre y guardar la cita es un solo paso. Asi dos clientas que
// eligen la misma hora al mismo tiempo nunca quedan las dos agendadas.
//
// El horario, el intervalo de turnos y la zona horaria salen de la
// configuracion que la duena guardo en el panel; aqui no hay nada fijo.

import type { CitaRegistrada, FranjaOcupada, NuevaCita } from '../compartido/citas/repositorioCitas';
import type { Cliente, DatosCliente } from '../compartido/clientes/repositorioClientes';
import { cierraElDia, franjasBloqueadas, type Bloqueo } from '../compartido/dominio/bloqueos';
import { franjasSeCruzan, HORA_NO_DISPONIBLE, horaAMinutos } from '../compartido/dominio/citas';
import {
  cabeEnElHorario,
  diaDeLaSemana,
  DIAS_MAXIMOS_DE_ANTICIPACION,
  esDemasiadoLejos,
  momentoEn,
  respetaElIntervalo,
  yaPaso,
  type ConfiguracionDelSalon,
  type HorarioDelDia,
} from '../compartido/dominio/horario';
import { esTelefonoValido, normalizarTelefono, TELEFONO_INVALIDO } from '../compartido/dominio/telefono';
import { generarCodigoDeConsulta, hashDeCodigo } from '../compartido/seguridad/codigosDeConsulta';
import { Conflicto, DatosInvalidos, NoEncontrado } from '../compartido/errores';
import type { Servicio } from '../compartido/servicios/repositorioServicios';

export interface SolicitudDeCita {
  servicioId: number;
  fecha: string; // YYYY-MM-DD
  inicio: string; // HH:MM
  contacto: DatosCliente;
}

// Solo lo que este caso de uso necesita de cada repositorio (Interface
// Segregation): en las pruebas basta con implementar estos metodos.
export interface RepositoriosDeAgendamiento {
  horario: {
    obtenerConfiguracion(): Promise<ConfiguracionDelSalon | null>;
    horarioDelDia(diaSemana: number): Promise<HorarioDelDia | null>;
  };
  bloqueos: { delDia(fecha: string): Promise<Bloqueo[]> };
  servicios: { obtenerActivoPorId(id: number): Promise<Servicio | null> };
  clientes: {
    buscarPorTelefono(telefono: string): Promise<Cliente | null>;
    crear(datos: DatosCliente): Promise<Cliente>;
  };
  citas: {
    bloquearDia(fecha: string): Promise<void>;
    bloquearTelefono(telefono: string): Promise<void>;
    ocupadasEl(fecha: string): Promise<FranjaOcupada[]>;
    crear(cita: NuevaCita): Promise<CitaRegistrada>;
    contarVigentesPorTelefono(telefono: string, desdeFecha: string): Promise<number>;
  };
}

// El codigo se entrega UNA sola vez, al agendar: en la base solo queda su hash.
export interface CitaAgendada {
  cita: CitaRegistrada;
  codigoDeConsulta: string;
}

export type EjecutarEnTransaccion = <T>(
  trabajo: (repositorios: RepositoriosDeAgendamiento) => Promise<T>,
) => Promise<T>;

// No dice cuantas citas hay ni que el problema es el telefono: quien escribe
// un telefono ajeno no tiene por que enterarse de eso.
const NO_SE_PUEDE_AGENDAR_EN_LINEA =
  'No pudimos agendar en linea con esos datos. Comunicate con el salon para reservar.';

export const SALON_SIN_CONFIGURAR = 'El salon todavia no tiene su horario configurado. Intenta mas tarde.';

export interface OpcionesDeAgendarCita {
  reloj?: () => Date;
  generarCodigo?: () => string;
}

export class AgendarCita {
  private readonly enTransaccion: EjecutarEnTransaccion;
  private readonly reloj: () => Date;
  private readonly generarCodigo: () => string;

  constructor(enTransaccion: EjecutarEnTransaccion, opciones: OpcionesDeAgendarCita = {}) {
    this.enTransaccion = enTransaccion;
    this.reloj = opciones.reloj ?? (() => new Date());
    this.generarCodigo = opciones.generarCodigo ?? generarCodigoDeConsulta;
  }

  async ejecutar(solicitud: SolicitudDeCita): Promise<CitaAgendada> {
    if (!esTelefonoValido(solicitud.contacto.telefono)) {
      throw new DatosInvalidos([TELEFONO_INVALIDO]);
    }
    const inicioMin = horaAMinutos(solicitud.inicio);

    return this.enTransaccion(async ({ horario, bloqueos, servicios, clientes, citas }) => {
      const configuracion = await horario.obtenerConfiguracion();
      if (!configuracion) {
        throw new Conflicto(SALON_SIN_CONFIGURAR);
      }
      const ahora = momentoEn(configuracion.zonaHoraria, this.reloj());
      if (yaPaso(solicitud.fecha, inicioMin, ahora)) {
        throw new DatosInvalidos(['La fecha y hora de la cita ya pasaron.']);
      }
      if (esDemasiadoLejos(solicitud.fecha, ahora)) {
        throw new DatosInvalidos([`Solo se puede agendar hasta con ${DIAS_MAXIMOS_DE_ANTICIPACION} dias de anticipacion.`]);
      }

      const horarioDelDia = await horario.horarioDelDia(diaDeLaSemana(solicitud.fecha));
      const bloqueosDelDia = await bloqueos.delDia(solicitud.fecha);
      if (!horarioDelDia || cierraElDia(bloqueosDelDia)) {
        throw new DatosInvalidos(['El salon no atiende ese dia.']);
      }

      const servicio = await servicios.obtenerActivoPorId(solicitud.servicioId);
      if (!servicio) {
        throw new NoEncontrado('El servicio elegido no existe o ya no esta disponible.');
      }

      const franja = { inicioMin, duracionMin: servicio.duracionMin };
      validarFranja(franja, horarioDelDia, configuracion.intervaloMin);

      await citas.bloquearDia(solicitud.fecha);
      // Las horas que bloqueo la duena cuentan igual que las ya ocupadas.
      const noDisponibles = [...(await citas.ocupadasEl(solicitud.fecha)), ...franjasBloqueadas(bloqueosDelDia)];
      if (noDisponibles.some((ocupada) => franjasSeCruzan(ocupada, franja))) {
        throw new Conflicto(HORA_NO_DISPONIBLE);
      }

      const telefono = normalizarTelefono(solicitud.contacto.telefono);
      // Desde aqui, contar y crear la ficha de ese telefono es un solo paso.
      await citas.bloquearTelefono(telefono);
      const vigentes = await citas.contarVigentesPorTelefono(telefono, ahora.fecha);
      if (vigentes >= configuracion.maxCitasPendientes) {
        throw new Conflicto(NO_SE_PUEDE_AGENDAR_EN_LINEA);
      }

      const clienta = await identificarClienta(clientes, { ...solicitud.contacto, telefono });
      const codigoDeConsulta = this.generarCodigo();
      const cita = await citas.crear({
        clienteId: clienta.id,
        servicioId: servicio.id,
        fecha: solicitud.fecha,
        inicioMin,
        duracionMin: servicio.duracionMin,
        precio: servicio.precio,
        nombreEscrito: solicitud.contacto.nombre,
        codigoHash: hashDeCodigo(codigoDeConsulta),
      });
      return { cita, codigoDeConsulta };
    });
  }
}

function validarFranja(franja: FranjaOcupada, horarioDelDia: HorarioDelDia, intervaloMin: number): void {
  if (!cabeEnElHorario(franja.inicioMin, franja.duracionMin, horarioDelDia)) {
    throw new DatosInvalidos(['Esa hora queda fuera del horario de atencion del salon.']);
  }
  if (!respetaElIntervalo(franja.inicioMin, horarioDelDia, intervaloMin)) {
    throw new DatosInvalidos(['Esa hora no coincide con los turnos que ofrece el salon.']);
  }
}

// La clienta se reconoce por su telefono: si ya vino antes, se usa su
// registro y su historial sigue completo; si no, se crea.
async function identificarClienta(
  clientes: RepositoriosDeAgendamiento['clientes'],
  contacto: DatosCliente, // con el telefono ya normalizado
): Promise<Cliente> {
  const existente = await clientes.buscarPorTelefono(contacto.telefono);
  return existente ?? clientes.crear(contacto);
}
