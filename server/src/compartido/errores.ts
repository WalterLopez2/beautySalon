// Errores con significado de negocio. El dominio y los casos de uso solo dicen
// QUE salio mal; `http/manejadorDeErrores.ts` decide el codigo HTTP.
// Los mensajes se muestran tal cual al usuario, por eso estan en lenguaje claro.

export class DatosInvalidos extends Error {
  readonly errores: string[];

  constructor(errores: string[]) {
    super(errores.join(' '));
    this.name = 'DatosInvalidos';
    this.errores = errores;
  }
}

export class NoAutorizado extends Error {
  constructor(mensaje = 'Necesitas iniciar sesion.') {
    super(mensaje);
    this.name = 'NoAutorizado';
  }
}

export class NoEncontrado extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'NoEncontrado';
  }
}

// El pedido es valido, pero choca con el estado actual (hora ya ocupada,
// cita que otra persona cambio al mismo tiempo...).
export class Conflicto extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'Conflicto';
  }
}
