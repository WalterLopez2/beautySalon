// Sesion abierta de la duena, solo para mostrarla. El token no esta aqui:
// viaja en una cookie HttpOnly y el unico que decide si sirve es el backend.

import type { SesionDTO } from '../../../compartido/tipos/api.ts'

export class Sesion {
  readonly nombre: string
  readonly expiraEn: Date

  constructor(nombre: string, expiraEn: Date) {
    if (Number.isNaN(expiraEn.getTime())) {
      throw new Error('La fecha de vencimiento de la sesion no es valida.')
    }

    this.nombre = nombre
    this.expiraEn = expiraEn
  }

  static desdeDTO(dto: SesionDTO): Sesion {
    return new Sesion(dto.nombre, new Date(dto.expiraEn))
  }
}
