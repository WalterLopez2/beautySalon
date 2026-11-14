// Caso de uso: cerrar la sesion de la duena.
//
// Primero se revoca el token en el servidor (asi no sirve aunque alguien lo
// haya copiado) y despues se borra del navegador. El borrado local ocurre
// SIEMPRE, aunque el servidor no responda: quien toca "cerrar sesion" espera
// salir del panel, no un mensaje de error.

import type { AlmacenDeSesion } from './almacenDeSesion.ts'
import type { RepositorioSesion } from './repositorioSesion.ts'

export class CerrarSesion {
  private readonly repositorio: RepositorioSesion
  private readonly almacen: AlmacenDeSesion

  constructor(repositorio: RepositorioSesion, almacen: AlmacenDeSesion) {
    this.repositorio = repositorio
    this.almacen = almacen
  }

  async ejecutar(): Promise<void> {
    try {
      await this.repositorio.cerrar()
    } finally {
      this.almacen.borrar()
    }
  }
}
