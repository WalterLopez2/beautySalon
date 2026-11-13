// Datos con los que la clienta se identifica al pedir cita. Refleja las reglas
// del `Cliente` del backend: nombre y telefono obligatorios, correo opcional.

import type { ContactoDTO } from '../../../compartido/tipos/api.ts'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DIGITOS_DE_TELEFONO = 8 // formato de Honduras

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
    if (this.cantidadDeDigitos() < DIGITOS_DE_TELEFONO) {
      errores.push('El telefono debe tener al menos 8 digitos.')
    }
    if (this.correo.trim() && !CORREO.test(this.correo.trim())) {
      errores.push('El correo electronico no es valido.')
    }
    return errores
  }

  sonValidos(): boolean {
    return this.errores().length === 0
  }

  aDTO(): ContactoDTO {
    return {
      nombre: this.nombre.trim(),
      telefono: this.telefono.trim(),
      correo: this.correo.trim() || null,
    }
  }

  private cantidadDeDigitos(): number {
    return this.telefono.replace(/\D/g, '').length
  }
}
