// Lo que la clienta va armando paso a paso: servicio, fecha, hora y contacto.
// Cada `con...` devuelve una solicitud nueva, asi que el estado de React solo
// reemplaza el objeto y la vista se redibuja sin efectos escondidos.

import type { SolicitudDeCitaDTO } from '../../../compartido/tipos/api.ts'
import type { Servicio } from '../../../compartido/dominio/Servicio.ts'
import { esAnteriorAHoy, esFechaValida } from '../../../compartido/utils/fecha.ts'
import { esHoraValida } from '../../../compartido/utils/hora.ts'
import { DatosDeContacto } from './DatosDeContacto.ts'
import { Franja } from '../../../compartido/dominio/Franja.ts'

export class SolicitudDeCita {
  readonly servicio: Servicio | null
  readonly fecha: string
  readonly hora: string
  readonly contacto: DatosDeContacto

  constructor(servicio: Servicio | null, fecha: string, hora: string, contacto: DatosDeContacto) {
    this.servicio = servicio
    this.fecha = fecha
    this.hora = hora
    this.contacto = contacto
  }

  static vacia(): SolicitudDeCita {
    return new SolicitudDeCita(null, '', '', DatosDeContacto.vacios())
  }

  // Cambiar el servicio cambia la duracion, asi que la hora elegida ya no sirve.
  conServicio(servicio: Servicio): SolicitudDeCita {
    return new SolicitudDeCita(servicio, this.fecha, '', this.contacto)
  }

  // Otra fecha tiene otra disponibilidad: tambien limpia la hora.
  conFecha(fecha: string): SolicitudDeCita {
    return new SolicitudDeCita(this.servicio, fecha, '', this.contacto)
  }

  conHora(hora: string): SolicitudDeCita {
    return new SolicitudDeCita(this.servicio, this.fecha, hora, this.contacto)
  }

  conContacto(contacto: DatosDeContacto): SolicitudDeCita {
    return new SolicitudDeCita(this.servicio, this.fecha, this.hora, contacto)
  }

  franja(): Franja | null {
    if (!this.servicio || !esHoraValida(this.hora)) return null
    return new Franja(this.hora, this.servicio.duracionMin)
  }

  precio(): number {
    return this.servicio?.precio ?? 0
  }

  // Un solo lugar con las reglas de "esta lista para enviar".
  errores(): string[] {
    const errores: string[] = []

    if (!this.servicio) {
      errores.push('Elegi el servicio que deseas.')
    }
    if (!esFechaValida(this.fecha)) {
      errores.push('Elegi la fecha de tu cita.')
    } else if (esAnteriorAHoy(this.fecha)) {
      errores.push('La fecha de la cita no puede ser anterior a hoy.')
    }
    if (!esHoraValida(this.hora)) {
      errores.push('Elegi la hora de tu cita.')
    }
    return [...errores, ...this.contacto.errores()]
  }

  estaCompleta(): boolean {
    return this.errores().length === 0
  }

  aDTO(): SolicitudDeCitaDTO {
    const servicio = this.servicio
    if (!servicio || !this.estaCompleta()) {
      throw new Error('La solicitud de cita todavia tiene datos pendientes.')
    }

    return {
      servicioId: servicio.id,
      fecha: this.fecha,
      inicio: this.hora,
      contacto: this.contacto.aDTO(),
    }
  }
}
