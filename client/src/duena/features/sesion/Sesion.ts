// Sesion abierta de la duena. El token lo emite el backend; aqui solo se
// guarda y se revisa si sigue vigente para no mandar peticiones que van a fallar.

import type { SesionDTO } from '../../../compartido/tipos/api.ts'

export class Sesion {
  readonly token: string
  readonly nombre: string
  readonly expiraEn: Date

  constructor(token: string, nombre: string, expiraEn: Date) {
    if (!token) {
      throw new Error('La sesion necesita un token.')
    }
    if (Number.isNaN(expiraEn.getTime())) {
      throw new Error('La fecha de vencimiento de la sesion no es valida.')
    }

    this.token = token
    this.nombre = nombre
    this.expiraEn = expiraEn
  }

  static desdeDTO(dto: SesionDTO): Sesion {
    return new Sesion(dto.token, dto.nombre, new Date(dto.expiraEn))
  }

  estaVigente(ahora: Date = new Date()): boolean {
    return ahora < this.expiraEn
  }

  aDTO(): SesionDTO {
    return { token: this.token, nombre: this.nombre, expiraEn: this.expiraEn.toISOString() }
  }
}
