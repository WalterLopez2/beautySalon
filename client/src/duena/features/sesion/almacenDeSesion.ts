// Puerto y adaptadores para recordar la sesion entre recargas de la pagina.

import type { SesionDTO } from '../../../compartido/tipos/api.ts'
import { Sesion } from './Sesion.ts'

export interface AlmacenDeSesion {
  leer(): Sesion | null
  guardar(sesion: Sesion): void
  borrar(): void
}

const CLAVE = 'beautySalon.sesionDuena'

// localStorage puede fallar (modo privado, almacenamiento bloqueado). En ese
// caso la sesion simplemente no se recuerda: nunca se rompe la app por esto.
export class AlmacenDeSesionLocal implements AlmacenDeSesion {
  leer(): Sesion | null {
    try {
      const guardada = localStorage.getItem(CLAVE)
      if (!guardada) return null

      const sesion = Sesion.desdeDTO(JSON.parse(guardada) as SesionDTO)
      return sesion.estaVigente() ? sesion : null
    } catch {
      return null
    }
  }

  guardar(sesion: Sesion): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesion.aDTO()))
    } catch {
      // Sin almacenamiento la sesion dura hasta recargar la pagina.
    }
  }

  borrar(): void {
    try {
      localStorage.removeItem(CLAVE)
    } catch {
      // Nada que borrar.
    }
  }
}

// Doble de prueba y respaldo: guarda la sesion solo en memoria.
export class AlmacenDeSesionEnMemoria implements AlmacenDeSesion {
  private sesion: Sesion | null = null

  leer(): Sesion | null {
    return this.sesion?.estaVigente() ? this.sesion : null
  }

  guardar(sesion: Sesion): void {
    this.sesion = sesion
  }

  borrar(): void {
    this.sesion = null
  }
}
