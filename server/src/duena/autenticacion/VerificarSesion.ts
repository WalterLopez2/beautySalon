// Casos de uso de una sesion ya abierta: comprobar que sigue valida y cerrarla.
//
// Un token bien firmado y sin vencer no alcanza: ademas su version tiene que
// coincidir con la guardada. Asi "cerrar sesion" y "cambiar contrasena"
// invalidan de verdad los tokens viejos, aunque alguien los haya copiado.

import { NoAutorizado } from '../../compartido/errores';
import type { EmisorDeTokens, SesionDeDuena } from './tokens';

export interface VersionesDeSesion {
  versionDeSesion(usuariaId: number): Promise<number | null>;
  revocarSesiones(usuariaId: number): Promise<void>;
}

const SESION_REVOCADA = 'Tu sesion se cerro. Inicia sesion de nuevo.';

export class VerificarSesion {
  private readonly tokens: EmisorDeTokens;
  private readonly versiones: Pick<VersionesDeSesion, 'versionDeSesion'>;

  constructor(tokens: EmisorDeTokens, versiones: Pick<VersionesDeSesion, 'versionDeSesion'>) {
    this.tokens = tokens;
    this.versiones = versiones;
  }

  async ejecutar(token: string): Promise<SesionDeDuena> {
    const sesion = this.tokens.verificar(token);
    const versionActual = await this.versiones.versionDeSesion(sesion.usuariaId);
    if (versionActual !== sesion.version) {
      throw new NoAutorizado(SESION_REVOCADA);
    }
    return sesion;
  }
}

// Cierra la sesion en TODOS los dispositivos de la duena: es lo seguro si
// alguna vez entro desde una computadora ajena.
export class CerrarSesion {
  private readonly versiones: Pick<VersionesDeSesion, 'revocarSesiones'>;

  constructor(versiones: Pick<VersionesDeSesion, 'revocarSesiones'>) {
    this.versiones = versiones;
  }

  ejecutar(sesion: SesionDeDuena): Promise<void> {
    return this.versiones.revocarSesiones(sesion.usuariaId);
  }
}
