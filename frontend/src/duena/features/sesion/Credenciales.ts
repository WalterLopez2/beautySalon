// Lo que la duena escribe en el formulario de inicio de sesion. Inmutable,
// igual que `DatosDeContacto` de la clienta: cada cambio devuelve una copia.

import type { CredencialesDTO } from '../../../compartido/tipos/api.ts'

export class Credenciales {
  readonly usuario: string
  readonly contrasena: string

  constructor(usuario: string, contrasena: string) {
    this.usuario = usuario
    this.contrasena = contrasena
  }

  static vacias(): Credenciales {
    return new Credenciales('', '')
  }

  con(cambios: Partial<CredencialesDTO>): Credenciales {
    return new Credenciales(cambios.usuario ?? this.usuario, cambios.contrasena ?? this.contrasena)
  }

  errores(): string[] {
    const errores: string[] = []

    if (!this.usuario.trim()) {
      errores.push('Escribi tu usuario.')
    }
    if (!this.contrasena) {
      errores.push('Escribi tu contrasena.')
    }
    return errores
  }

  // La contrasena no se recorta: los espacios pueden ser parte de ella.
  aDTO(): CredencialesDTO {
    return { usuario: this.usuario.trim(), contrasena: this.contrasena }
  }
}
