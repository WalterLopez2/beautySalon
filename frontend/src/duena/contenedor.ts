// Composicion de dependencias del panel de la duena. Es el unico archivo de
// `duena/` que decide implementaciones concretas; el resto recibe interfaces.
// La sesion viaja sola en una cookie, asi que al iniciar o cerrar sesion no
// hay que reconstruir nada.

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
import { AvisosDeSesion } from './features/sesion/avisosDeSesion.ts'
import { CerrarSesion } from './features/sesion/CerrarSesion.ts'
import { RecuperarSesion } from './features/sesion/RecuperarSesion.ts'
import { IniciarSesion } from './features/sesion/IniciarSesion.ts'
import { RepositorioSesionHttp } from './features/sesion/repositorioSesion.ts'

export interface ContenedorDuena {
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
  const avisosDeSesion = new AvisosDeSesion()
  // Al entrar, recuperar o salir, un 401 es una respuesta normal ("no hay
  // sesion"). En el resto del panel significa que se perdio: se vuelve al login.
  const repositorioSesion = new RepositorioSesionHttp(new ClienteHttp(urlBase))
  const http = new ClienteHttp(urlBase, () => avisosDeSesion.avisarQueSePerdio())
  const repositorioAgenda = new RepositorioAgendaHttp(http)
  const repositorioCatalogo = new RepositorioCatalogoHttp(http)
  const repositorioHorario = new RepositorioHorarioHttp(http)
  const repositorioBloqueos = new RepositorioBloqueosHttp(http)

  return {
    avisosDeSesion,
    iniciarSesion: new IniciarSesion(repositorioSesion),
    recuperarSesion: new RecuperarSesion(repositorioSesion),
    cerrarSesion: new CerrarSesion(repositorioSesion),
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
