// Composicion de dependencias del panel de la duena. Es el unico archivo de
// `duena/` que decide implementaciones concretas; el resto recibe interfaces.
// El cliente HTTP lee el token del almacen en cada peticion, asi que al iniciar
// o cerrar sesion no hay que reconstruir nada.

import { URL_DE_LA_API } from '../compartido/configuracion.ts'
import { ClienteHttp } from '../compartido/http/clienteHttp.ts'
import { CambiarEstadoDeCita } from './features/agenda/CambiarEstadoDeCita.ts'
import { RepositorioAgendaHttp } from './features/agenda/repositorioAgenda.ts'
import type { RepositorioAgenda } from './features/agenda/repositorioAgenda.ts'
import { CrearBloqueo } from './features/bloqueos/CrearBloqueo.ts'
import { RepositorioBloqueosHttp } from './features/bloqueos/repositorioBloqueos.ts'
import type { RepositorioBloqueos } from './features/bloqueos/repositorioBloqueos.ts'
import { GuardarServicio } from './features/catalogo/GuardarServicio.ts'
import { RepositorioCatalogoHttp } from './features/catalogo/repositorioCatalogo.ts'
import type { RepositorioCatalogo } from './features/catalogo/repositorioCatalogo.ts'
import { RepositorioClientasHttp } from './features/clientas/repositorioClientas.ts'
import type { RepositorioClientas } from './features/clientas/repositorioClientas.ts'
import { GuardarHorario } from './features/horario/GuardarHorario.ts'
import { RepositorioHorarioHttp } from './features/horario/repositorioHorario.ts'
import type { RepositorioHorario } from './features/horario/repositorioHorario.ts'
import { AlmacenDeSesionLocal } from './features/sesion/almacenDeSesion.ts'
import { AvisosDeSesion } from './features/sesion/avisosDeSesion.ts'
import { CerrarSesion } from './features/sesion/CerrarSesion.ts'
import { RecuperarSesion } from './features/sesion/RecuperarSesion.ts'
import type { AlmacenDeSesion } from './features/sesion/almacenDeSesion.ts'
import { IniciarSesion } from './features/sesion/IniciarSesion.ts'
import { RepositorioSesionHttp } from './features/sesion/repositorioSesion.ts'

export interface ContenedorDuena {
  almacenDeSesion: AlmacenDeSesion
  avisosDeSesion: AvisosDeSesion
  iniciarSesion: IniciarSesion
  recuperarSesion: RecuperarSesion
  cerrarSesion: CerrarSesion
  repositorioAgenda: RepositorioAgenda
  cambiarEstadoDeCita: CambiarEstadoDeCita
  repositorioClientas: RepositorioClientas
  repositorioCatalogo: RepositorioCatalogo
  guardarServicio: GuardarServicio
  repositorioHorario: RepositorioHorario
  guardarHorario: GuardarHorario
  repositorioBloqueos: RepositorioBloqueos
  crearBloqueo: CrearBloqueo
}

function crearContenedor(urlBase: string): ContenedorDuena {
  const almacenDeSesion = new AlmacenDeSesionLocal()
  const avisosDeSesion = new AvisosDeSesion()
  const http = new ClienteHttp(
    urlBase,
    () => almacenDeSesion.leer()?.token ?? null,
    // El servidor rechazo el token: se olvida y la app vuelve al login.
    () => {
      almacenDeSesion.borrar()
      avisosDeSesion.avisarQueSePerdio()
    },
  )
  const repositorioSesion = new RepositorioSesionHttp(http)
  const repositorioAgenda = new RepositorioAgendaHttp(http)
  const repositorioCatalogo = new RepositorioCatalogoHttp(http)
  const repositorioHorario = new RepositorioHorarioHttp(http)
  const repositorioBloqueos = new RepositorioBloqueosHttp(http)

  return {
    almacenDeSesion,
    avisosDeSesion,
    iniciarSesion: new IniciarSesion(repositorioSesion, almacenDeSesion),
    recuperarSesion: new RecuperarSesion(repositorioSesion, almacenDeSesion),
    cerrarSesion: new CerrarSesion(repositorioSesion, almacenDeSesion),
    repositorioAgenda,
    cambiarEstadoDeCita: new CambiarEstadoDeCita(repositorioAgenda),
    repositorioClientas: new RepositorioClientasHttp(http),
    repositorioCatalogo,
    guardarServicio: new GuardarServicio(repositorioCatalogo),
    repositorioHorario,
    guardarHorario: new GuardarHorario(repositorioHorario),
    repositorioBloqueos,
    crearBloqueo: new CrearBloqueo(repositorioBloqueos),
  }
}

export const contenedorDuena = crearContenedor(URL_DE_LA_API)
