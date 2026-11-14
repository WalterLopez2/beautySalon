// Base de los errores de reglas de negocio que se muestran tal cual al usuario
// (una lista de mensajes, uno por problema). Cada vista define los suyos
// heredando de aqui, asi `compartido/` no depende ni de la clienta ni de la duena.

export class ErrorDeValidacion extends Error {
  readonly errores: string[]

  constructor(errores: string[]) {
    super(errores.join(' '))
    this.name = 'ErrorDeValidacion'
    this.errores = errores
  }
}
