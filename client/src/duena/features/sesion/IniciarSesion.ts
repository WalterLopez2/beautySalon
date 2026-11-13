// Caso de uso: valida las credenciales, pide la sesion y la recuerda.

import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { AlmacenDeSesion } from './almacenDeSesion.ts'
import type { Credenciales } from './Credenciales.ts'
import type { RepositorioSesion } from './repositorioSesion.ts'
import type { Sesion } from './Sesion.ts'

export class CredencialesInvalidas extends ErrorDeValidacion {
  constructor(errores: string[]) {
    super(errores)
    this.name = 'CredencialesInvalidas'
  }
}

export class IniciarSesion {
  private readonly repositorio: RepositorioSesion
  private readonly almacen: AlmacenDeSesion

  constructor(repositorio: RepositorioSesion, almacen: AlmacenDeSesion) {
    this.repositorio = repositorio
    this.almacen = almacen
  }

  async ejecutar(credenciales: Credenciales): Promise<Sesion> {
    const errores = credenciales.errores()
    if (errores.length > 0) {
      throw new CredencialesInvalidas(errores)
    }

    const sesion = await this.repositorio.iniciar(credenciales.aDTO())
    this.almacen.guardar(sesion)
    return sesion
  }
}
