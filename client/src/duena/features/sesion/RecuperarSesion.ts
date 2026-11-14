// Caso de uso: al abrir el panel, recuperar la sesion guardada SOLO si el
// servidor confirma que sigue valida. Un token puede estar sin vencer en el
// navegador y aun asi estar revocado (por ejemplo, si la duena cerro sesion
// desde otro dispositivo o cambio su contrasena).

import { ErrorDeApi } from '../../../compartido/http/clienteHttp.ts'
import type { AlmacenDeSesion } from './almacenDeSesion.ts'
import type { RepositorioSesion } from './repositorioSesion.ts'
import type { Sesion } from './Sesion.ts'

export class RecuperarSesion {
  private readonly repositorio: RepositorioSesion
  private readonly almacen: AlmacenDeSesion

  constructor(repositorio: RepositorioSesion, almacen: AlmacenDeSesion) {
    this.repositorio = repositorio
    this.almacen = almacen
  }

  async ejecutar(): Promise<Sesion | null> {
    const guardada = this.almacen.leer()
    if (!guardada) return null

    try {
      await this.repositorio.verificar()
      return guardada
    } catch (causa) {
      if (causa instanceof ErrorDeApi && causa.esDeSesion()) {
        this.almacen.borrar()
        return null
      }
      // Sin conexion no se puede confirmar, pero tampoco desmentir: se deja
      // entrar y cada pedido al servidor volvera a comprobar el token.
      if (causa instanceof ErrorDeApi && causa.esDeConexion()) {
        return guardada
      }
      throw causa
    }
  }
}
