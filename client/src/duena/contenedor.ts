// Composicion de dependencias del panel de la duena. Es el unico archivo de
// `duena/` que decide implementaciones concretas; el resto recibe interfaces.
// El cliente HTTP lee el token del almacen en cada peticion, asi que al iniciar
// o cerrar sesion no hay que reconstruir nada.

import { URL_DE_LA_API } from '../compartido/configuracion.ts'
import { ClienteHttp } from '../compartido/http/clienteHttp.ts'
import { CambiarEstadoDeCita } from './features/agenda/CambiarEstadoDeCita.ts'
import { RepositorioAgendaHttp } from './features/agenda/repositorioAgenda.ts'
import type { RepositorioAgenda } from './features/agenda/repositorioAgenda.ts'
import { RepositorioClientasHttp } from './features/clientas/repositorioClientas.ts'
import type { RepositorioClientas } from './features/clientas/repositorioClientas.ts'
import { AlmacenDeSesionLocal } from './features/sesion/almacenDeSesion.ts'
import type { AlmacenDeSesion } from './features/sesion/almacenDeSesion.ts'
import { IniciarSesion } from './features/sesion/IniciarSesion.ts'
import { RepositorioSesionHttp } from './features/sesion/repositorioSesion.ts'

export interface ContenedorDuena {
  almacenDeSesion: AlmacenDeSesion
  iniciarSesion: IniciarSesion
  repositorioAgenda: RepositorioAgenda
  cambiarEstadoDeCita: CambiarEstadoDeCita
  repositorioClientas: RepositorioClientas
}

function crearContenedor(urlBase: string): ContenedorDuena {
  const almacenDeSesion = new AlmacenDeSesionLocal()
  const http = new ClienteHttp(urlBase, () => almacenDeSesion.leer()?.token ?? null)
  const repositorioAgenda = new RepositorioAgendaHttp(http)

  return {
    almacenDeSesion,
    iniciarSesion: new IniciarSesion(new RepositorioSesionHttp(http), almacenDeSesion),
    repositorioAgenda,
    cambiarEstadoDeCita: new CambiarEstadoDeCita(repositorioAgenda),
    repositorioClientas: new RepositorioClientasHttp(http),
  }
}

export const contenedorDuena = crearContenedor(URL_DE_LA_API)
