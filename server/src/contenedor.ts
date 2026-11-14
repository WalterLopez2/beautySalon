// Composicion de dependencias (el "cableado"). Es el unico archivo que crea
// implementaciones concretas; las rutas y los casos de uso reciben interfaces.
// En las pruebas, `crearApp` se arma con dobles en vez de esto.

import type { DependenciasDeLaApp } from './app';
import { AgendarCita } from './clienta/AgendarCita';
import { ConsultarAgendaDelDia } from './clienta/ConsultarAgendaDelDia';
import type { BaseDeDatos } from './compartido/baseDeDatos/baseDeDatos';
import { RepositorioBloqueos } from './compartido/bloqueos/repositorioBloqueos';
import { RepositorioCitas } from './compartido/citas/repositorioCitas';
import { RepositorioClientes } from './compartido/clientes/repositorioClientes';
import { RepositorioHorario } from './compartido/horario/repositorioHorario';
import { LimitadorDeIntentos } from './compartido/seguridad/LimitadorDeIntentos';
import { LIMITES } from './compartido/seguridad/limites';
import { RepositorioServicios } from './compartido/servicios/repositorioServicios';
import type { Configuracion } from './configuracion';
import { IniciarSesion } from './duena/autenticacion/IniciarSesion';
import { RepositorioUsuarias } from './duena/autenticacion/repositorioUsuarias';
import { EmisorDeTokens } from './duena/autenticacion/tokens';
import { CerrarSesion, VerificarSesion } from './duena/autenticacion/VerificarSesion';
import { CambiarEstadoDeCita } from './duena/CambiarEstadoDeCita';
import { CrearBloqueo } from './duena/configuracion/CrearBloqueo';
import { GuardarHorario } from './duena/configuracion/GuardarHorario';

export function crearDependencias(baseDeDatos: BaseDeDatos, configuracion: Configuracion): DependenciasDeLaApp {
  const horario = new RepositorioHorario(baseDeDatos);
  const bloqueos = new RepositorioBloqueos(baseDeDatos);
  const servicios = new RepositorioServicios(baseDeDatos);
  const citas = new RepositorioCitas(baseDeDatos);
  const clientes = new RepositorioClientes(baseDeDatos);
  const usuarias = new RepositorioUsuarias(baseDeDatos);
  const tokens = new EmisorDeTokens(configuracion.secretoDeTokens, configuracion.duracionDeSesionMs);

  // Los casos de uso que escriben en varias tablas reciben repositorios
  // atados a una misma transaccion.
  const agendarCita = new AgendarCita((trabajo) =>
    baseDeDatos.transaccion((consultor) =>
      trabajo({
        horario: new RepositorioHorario(consultor),
        bloqueos: new RepositorioBloqueos(consultor),
        servicios: new RepositorioServicios(consultor),
        clientes: new RepositorioClientes(consultor),
        citas: new RepositorioCitas(consultor),
      }),
    ),
  );
  const guardarHorario = new GuardarHorario((trabajo) =>
    baseDeDatos.transaccion((consultor) => trabajo(new RepositorioHorario(consultor))),
  );

  return {
    clienta: {
      consultarAgenda: new ConsultarAgendaDelDia({ horario, bloqueos, citas }),
      servicios,
      citas,
      agendarCita,
      limites: {
        agendar: new LimitadorDeIntentos(LIMITES.agendarPorIp),
        consultarHistorial: new LimitadorDeIntentos(LIMITES.consultarHistorialPorIp),
      },
    },
    duena: {
      iniciarSesion: new IniciarSesion({
        usuarias,
        tokens,
        limites: {
          porUsuario: new LimitadorDeIntentos(LIMITES.loginPorUsuario),
          porIp: new LimitadorDeIntentos(LIMITES.loginPorIp),
        },
      }),
      verificarSesion: new VerificarSesion(tokens, usuarias),
      cerrarSesion: new CerrarSesion(usuarias),
      cambiarEstadoDeCita: new CambiarEstadoDeCita(citas),
      citas,
      clientes,
      configuracion: { servicios, horario, guardarHorario },
      bloqueos: { bloqueos, crearBloqueo: new CrearBloqueo({ bloqueos, citas }) },
    },
  };
}
