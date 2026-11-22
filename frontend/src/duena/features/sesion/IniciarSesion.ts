// Caso de uso: valida las credenciales y pide la sesion. La recuerda el
// navegador, en su cookie.

import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import { ErrorDeApi } from '../../../compartido/http/clienteHttp.ts'
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

  constructor(repositorio: RepositorioSesion) {
    this.repositorio = repositorio
  }

  async ejecutar(credenciales: Credenciales): Promise<Sesion> {
    const errores = credenciales.errores()
    if (errores.length > 0) {
      throw new CredencialesInvalidas(errores)
    }

    try {
      return await this.repositorio.iniciar(credenciales.aDTO())
    } catch (causa) {
      // En el login un 401 es "clave incorrecta", no "tu sesion vencio".
      if (causa instanceof ErrorDeApi && causa.esDeSesion()) throw new CredencialesInvalidas([causa.message])
      throw causa
    }
  }
}
