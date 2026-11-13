// Composicion de dependencias de la vista publica (el "cableado"). Es el unico
// archivo de `clienta/` que decide implementaciones concretas; el resto recibe
// interfaces. Para probar, se arma otro contenedor con repositorios falsos.

import { RepositorioServiciosHttp } from '../compartido/dominio/repositorioServicios.ts'
import type { RepositorioServicios } from '../compartido/dominio/repositorioServicios.ts'
import { URL_DE_LA_API } from '../compartido/configuracion.ts'
import { ClienteHttp } from '../compartido/http/clienteHttp.ts'
import { AgendarCita } from './features/agendamiento/AgendarCita.ts'
import { RepositorioCitasHttp } from './features/agendamiento/repositorioCitas.ts'
import type { RepositorioCitas } from './features/agendamiento/repositorioCitas.ts'

export interface ContenedorClienta {
  repositorioServicios: RepositorioServicios
  repositorioCitas: RepositorioCitas
  agendarCita: AgendarCita
}

function crearContenedor(urlBase: string): ContenedorClienta {
  const http = new ClienteHttp(urlBase)
  const repositorioCitas = new RepositorioCitasHttp(http)

  return {
    repositorioServicios: new RepositorioServiciosHttp(http),
    repositorioCitas,
    agendarCita: new AgendarCita(repositorioCitas),
  }
}

export const contenedor = crearContenedor(URL_DE_LA_API)
