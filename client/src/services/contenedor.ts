// Composicion de dependencias (el "cableado" de la app). Es el unico archivo
// que decide implementaciones concretas; el resto del codigo recibe interfaces.
// Para probar, se arma otro contenedor con repositorios falsos.

import { AgendarCita } from '../features/appointments/AgendarCita.ts'
import { RepositorioCitasHttp } from '../features/appointments/repositorioCitas.ts'
import type { RepositorioCitas } from '../features/appointments/repositorioCitas.ts'
import { RepositorioServiciosHttp } from '../features/services/repositorioServicios.ts'
import type { RepositorioServicios } from '../features/services/repositorioServicios.ts'
import { ClienteHttp } from './clienteHttp.ts'

export interface Contenedor {
  repositorioServicios: RepositorioServicios
  repositorioCitas: RepositorioCitas
  agendarCita: AgendarCita
}

const URL_DE_LA_API = import.meta.env.VITE_API_URL ?? '/api'

function crearContenedor(urlBase: string): Contenedor {
  const http = new ClienteHttp(urlBase)
  const repositorioCitas = new RepositorioCitasHttp(http)

  return {
    repositorioServicios: new RepositorioServiciosHttp(http),
    repositorioCitas,
    agendarCita: new AgendarCita(repositorioCitas),
  }
}

export const contenedor = crearContenedor(URL_DE_LA_API)
