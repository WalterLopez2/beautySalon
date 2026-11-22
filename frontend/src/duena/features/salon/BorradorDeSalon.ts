// Lo que la duena escribe en "Mi salon". Inmutable, como los otros borradores.

import type { InformacionDelSalonDTO } from '../../../compartido/tipos/api.ts'
import { TELEFONO_INVALIDO, esTelefonoValido } from '../../../compartido/utils/telefono.ts'

export interface CamposDelSalon {
  nombre: string
  marca: string
  eslogan: string
  descripcion: string
  telefono: string
}

export interface CampoDeSalon {
  campo: keyof CamposDelSalon
  etiqueta: string
  ayuda: string
  maximo: number // igual que el backend
}

export const CAMPOS_DEL_SALON: readonly CampoDeSalon[] = [
  { campo: 'nombre', etiqueta: 'Nombre del salon', ayuda: 'Sale al pie de la pagina y en la pestana.', maximo: 80 },
  { campo: 'marca', etiqueta: 'Nombre corto', ayuda: 'Sale arriba, junto al menu. Si lo dejas vacio se usa el nombre.', maximo: 24 },
  { campo: 'eslogan', etiqueta: 'Eslogan', ayuda: 'Es el titulo grande de la pagina.', maximo: 120 },
  { campo: 'descripcion', etiqueta: 'Descripcion', ayuda: 'El texto debajo del eslogan.', maximo: 300 },
  { campo: 'telefono', etiqueta: 'WhatsApp del salon', ayuda: 'Opcional. Es publico: ahi te escriben las clientas.', maximo: 30 },
]

export class BorradorDeSalon {
  readonly campos: CamposDelSalon

  constructor(campos: CamposDelSalon) {
    this.campos = campos
  }

  static desdeDTO(dto: InformacionDelSalonDTO | null): BorradorDeSalon {
    return new BorradorDeSalon({
      nombre: dto?.nombre ?? '',
      marca: dto?.marca ?? '',
      eslogan: dto?.eslogan ?? '',
      descripcion: dto?.descripcion ?? '',
      telefono: dto?.telefono ?? '',
    })
  }

  con(cambios: Partial<CamposDelSalon>): BorradorDeSalon {
    return new BorradorDeSalon({ ...this.campos, ...cambios })
  }

  errores(): string[] {
    const errores: string[] = []
    const telefono = this.campos.telefono.trim()

    if (!this.campos.nombre.trim()) {
      errores.push('Escribi el nombre del salon.')
    }
    if (telefono && !esTelefonoValido(telefono)) {
      errores.push(TELEFONO_INVALIDO)
    }
    return errores
  }

  aDTO(): InformacionDelSalonDTO {
    const { nombre, marca, eslogan, descripcion, telefono } = this.campos
    return {
      nombre: nombre.trim(),
      marca: marca.trim() || null,
      eslogan: eslogan.trim() || null,
      descripcion: descripcion.trim() || null,
      telefono: telefono.trim() || null,
    }
  }
}
