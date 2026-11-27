// Datos con los que la clienta se identifica al pedir cita. Refleja las reglas
// del `Cliente` del backend: nombre y telefono obligatorios, correo opcional.

import type { ContactoDTO } from '../../../compartido/tipos/api.ts'
import { TELEFONO_INVALIDO, esTelefonoValido } from '../../../compartido/utils/telefono.ts'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class DatosDeContacto {
  readonly nombre: string
  readonly telefono: string
  readonly correo: string

  constructor(nombre: string, telefono: string, correo: string) {
    this.nombre = nombre
    this.telefono = telefono
    this.correo = correo
  }

  static vacios(): DatosDeContacto {
    return new DatosDeContacto('', '', '')
  }

  // Devuelve una copia con los campos cambiados: el formulario nunca muta.
  con(cambios: Partial<ContactoDTO>): DatosDeContacto {
    return new DatosDeContacto(
      cambios.nombre ?? this.nombre,
      cambios.telefono ?? this.telefono,
      cambios.correo ?? this.correo,
    )
  }

  // Un mensaje por campo invalido, listo para mostrar debajo del input.
  errores(): string[] {
    const errores: string[] = []

    if (!this.nombre.trim()) {
      errores.push('Escribi tu nombre.')
    }
    if (!esTelefonoValido(this.telefono)) {
      errores.push(TELEFONO_INVALIDO)
    }
    if (this.correo.trim() && !CORREO.test(this.correo.trim())) {
      errores.push('El correo electronico no es valido.')
    }
    return errores
  }

  aDTO(): ContactoDTO {
    return {
      nombre: this.nombre.trim(),
      telefono: this.telefono.trim(),
      correo: this.correo.trim() || null,
    }
  }
}
