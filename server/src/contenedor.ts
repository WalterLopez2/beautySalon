// Composicion de dependencias (el "cableado"). Es el unico archivo que crea
// implementaciones concretas; las rutas y los casos de uso reciben interfaces.
// En las pruebas, `crearApp` se arma con dobles en vez de esto.

import type { DependenciasDeLaApp } from './app';
import { AgendarCita } from './clienta/AgendarCita';
import type { BaseDeDatos } from './compartido/baseDeDatos/baseDeDatos';
import { RepositorioCitas } from './compartido/citas/repositorioCitas';
import { RepositorioClientes } from './compartido/clientes/repositorioClientes';
import { RepositorioServicios } from './compartido/servicios/repositorioServicios';
import type { Configuracion } from './configuracion';
import { IniciarSesion } from './duena/autenticacion/IniciarSesion';
import { RepositorioUsuarias } from './duena/autenticacion/repositorioUsuarias';
import { EmisorDeTokens } from './duena/autenticacion/tokens';
import { CambiarEstadoDeCita } from './duena/CambiarEstadoDeCita';

export function crearDependencias(baseDeDatos: BaseDeDatos, configuracion: Configuracion): DependenciasDeLaApp {
  const servicios = new RepositorioServicios(baseDeDatos);
  const citas = new RepositorioCitas(baseDeDatos);
  const clientes = new RepositorioClientes(baseDeDatos);
  const tokens = new EmisorDeTokens(configuracion.secretoDeTokens, configuracion.duracionDeSesionMs);

  // Agendar necesita que todos sus repositorios compartan la misma transaccion.
  const agendarCita = new AgendarCita((trabajo) =>
    baseDeDatos.transaccion((consultor) =>
      trabajo({
        servicios: new RepositorioServicios(consultor),
        clientes: new RepositorioClientes(consultor),
        citas: new RepositorioCitas(consultor),
      }),
    ),
  );

  return {
    clienta: { servicios, citas, agendarCita },
    duena: {
      tokens,
      iniciarSesion: new IniciarSesion(new RepositorioUsuarias(baseDeDatos), tokens),
      cambiarEstadoDeCita: new CambiarEstadoDeCita(citas),
      citas,
      clientes,
    },
  };
}
