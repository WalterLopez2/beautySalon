// Caso de uso: la duena entra al panel con usuario y contrasena.
//
// - El mensaje de error es el mismo si el usuario no existe o si la
//   contrasena esta mal, y en ambos casos se hace el mismo trabajo de scrypt:
//   nadie puede averiguar que usuarios existen por el mensaje ni por el tiempo.
// - Tras varios fallos se bloquea un rato (por usuario+IP y por IP), para que
//   no se puedan probar miles de contrasenas.
// - El intento se cuenta ANTES de revisar la contrasena y se devuelve si no
//   fue un fallo. Si se contara despues, cientos de pedidos simultaneos
//   pasarian el limite mientras scrypt todavia calcula el primero.

import { NoAutorizado } from '../../compartido/errores';
import type { LimitadorPorIp } from '../../compartido/seguridad/LimitadorPorIp';
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
    porUsuario: LimitadorPorIp;
    porIp: LimitadorPorIp;
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
    const { tokens, limites } = this.dependencias;
    const cuenta = usuario.trim().toLowerCase();
    this.reservarIntento(cuenta, ip);

    const usuaria = await this.autenticar({ usuario, contrasena }).catch((error: unknown) => {
      this.devolverIntento(cuenta, ip); // fallo el sistema, no la duena
      throw error;
    });
    if (!usuaria) {
      throw new NoAutorizado(CREDENCIALES_INCORRECTAS);
    }

    limites.porIp.devolver(ip);
    limites.porUsuario.reiniciar(ip, cuenta);
    const { token, expiraEn } = tokens.emitir(usuaria.id, usuaria.nombre, usuaria.versionSesion);
    return { token, nombre: usuaria.nombre, expiraEn: expiraEn.toISOString() };
  }

  // Sin ningun `await`: entre revisar y contar no se puede colar otro pedido.
  // Se revisan los dos limites antes de contar en cualquiera de ellos.
  private reservarIntento(cuenta: string, ip: string): void {
    const { porIp, porUsuario } = this.dependencias.limites;
    porIp.exigirDisponible(ip);
    porUsuario.exigirDisponible(ip, cuenta);
    porIp.registrar(ip);
    porUsuario.registrar(ip, cuenta);
  }

  private devolverIntento(cuenta: string, ip: string): void {
    const { porIp, porUsuario } = this.dependencias.limites;
    porIp.devolver(ip);
    porUsuario.devolver(ip, cuenta);
  }

  // null = el usuario no existe o la contrasena esta mal.
  private async autenticar({ usuario, contrasena }: Credenciales): Promise<Usuaria | null> {
    const usuaria = await this.dependencias.usuarias.buscarPorUsuario(usuario);
    const hash = usuaria?.hashContrasena ?? (await this.obtenerHashDeRelleno());
    const contrasenaCorrecta = await verificarContrasena(contrasena, hash);
    return contrasenaCorrecta ? usuaria : null;
  }

  // Se calcula una sola vez y solo se usa para gastar el mismo tiempo.
  private obtenerHashDeRelleno(): Promise<string> {
    this.hashDeRelleno ??= cifrarContrasena('relleno-para-igualar-tiempos');
    return this.hashDeRelleno;
  }
}
