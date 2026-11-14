// Caso de uso: la duena entra al panel con usuario y contrasena.
//
// - El mensaje de error es el mismo si el usuario no existe o si la
//   contrasena esta mal, y en ambos casos se hace el mismo trabajo de scrypt:
//   nadie puede averiguar que usuarios existen por el mensaje ni por el tiempo.
// - Tras varios fallos se bloquea un rato (por usuario+IP y por IP), para que
//   no se puedan probar miles de contrasenas.

import { NoAutorizado } from '../../compartido/errores';
import type { LimitadorDeIntentos } from '../../compartido/seguridad/LimitadorDeIntentos';
import { cifrarContrasena, verificarContrasena } from './contrasenas';
import type { Usuaria } from './repositorioUsuarias';
import type { EmisorDeTokens } from './tokens';

export interface Credenciales {
  usuario: string;
  contrasena: string;
}

export interface SesionIniciada {
  token: string;
  nombre: string;
  expiraEn: string; // ISO 8601, como lo espera el frontend
}

export interface DependenciasDeIniciarSesion {
  usuarias: { buscarPorUsuario(usuario: string): Promise<Usuaria | null> };
  tokens: EmisorDeTokens;
  limites: {
    porUsuario: LimitadorDeIntentos;
    porIp: LimitadorDeIntentos;
  };
}

const CREDENCIALES_INCORRECTAS = 'Usuario o contrasena incorrectos.';

export class IniciarSesion {
  private readonly dependencias: DependenciasDeIniciarSesion;
  private hashDeRelleno: Promise<string> | null = null;

  constructor(dependencias: DependenciasDeIniciarSesion) {
    this.dependencias = dependencias;
  }

  // `ip` identifica de donde viene el intento, para los limites.
  async ejecutar({ usuario, contrasena }: Credenciales, ip: string): Promise<SesionIniciada> {
    const { usuarias, tokens, limites } = this.dependencias;
    const claveDeUsuario = `${usuario.trim().toLowerCase()}|${ip}`;
    limites.porIp.exigirDisponible(ip);
    limites.porUsuario.exigirDisponible(claveDeUsuario);

    const usuaria = await usuarias.buscarPorUsuario(usuario);
    const hash = usuaria?.hashContrasena ?? (await this.obtenerHashDeRelleno());
    const contrasenaCorrecta = await verificarContrasena(contrasena, hash);

    if (!usuaria || !contrasenaCorrecta) {
      limites.porIp.registrar(ip);
      limites.porUsuario.registrar(claveDeUsuario);
      throw new NoAutorizado(CREDENCIALES_INCORRECTAS);
    }

    limites.porUsuario.reiniciar(claveDeUsuario);
    const { token, expiraEn } = tokens.emitir(usuaria.id, usuaria.nombre, usuaria.versionSesion);
    return { token, nombre: usuaria.nombre, expiraEn: expiraEn.toISOString() };
  }

  // Se calcula una sola vez y solo se usa para gastar el mismo tiempo.
  private obtenerHashDeRelleno(): Promise<string> {
    this.hashDeRelleno ??= cifrarContrasena('relleno-para-igualar-tiempos');
    return this.hashDeRelleno;
  }
}
