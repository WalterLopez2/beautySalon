// Caso de uso: la duena entra al panel con usuario y contrasena.
//
// El mensaje de error es el mismo si el usuario no existe o si la contrasena
// esta mal, y en ambos casos se hace el mismo trabajo de scrypt. Asi nadie
// puede averiguar que usuarios existen por el mensaje ni por el tiempo.

import { NoAutorizado } from '../../compartido/errores';
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

export interface BuscadorDeUsuarias {
  buscarPorUsuario(usuario: string): Promise<Usuaria | null>;
}

const CREDENCIALES_INCORRECTAS = 'Usuario o contrasena incorrectos.';

export class IniciarSesion {
  private readonly usuarias: BuscadorDeUsuarias;
  private readonly tokens: EmisorDeTokens;
  private hashDeRelleno: Promise<string> | null = null;

  constructor(usuarias: BuscadorDeUsuarias, tokens: EmisorDeTokens) {
    this.usuarias = usuarias;
    this.tokens = tokens;
  }

  async ejecutar({ usuario, contrasena }: Credenciales): Promise<SesionIniciada> {
    const usuaria = await this.usuarias.buscarPorUsuario(usuario);
    const hash = usuaria?.hashContrasena ?? (await this.obtenerHashDeRelleno());
    const contrasenaCorrecta = await verificarContrasena(contrasena, hash);

    if (!usuaria || !contrasenaCorrecta) {
      throw new NoAutorizado(CREDENCIALES_INCORRECTAS);
    }

    const { token, expiraEn } = this.tokens.emitir(usuaria.id, usuaria.nombre);
    return { token, nombre: usuaria.nombre, expiraEn: expiraEn.toISOString() };
  }

  // Se calcula una sola vez y solo se usa para gastar el mismo tiempo.
  private obtenerHashDeRelleno(): Promise<string> {
    this.hashDeRelleno ??= cifrarContrasena('relleno-para-igualar-tiempos');
    return this.hashDeRelleno;
  }
}
