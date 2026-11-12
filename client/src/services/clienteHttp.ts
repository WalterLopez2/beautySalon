// Unico punto del frontend que sabe hablar HTTP. Las clases del dominio y los
// repositorios dependen de esta interfaz, no de `fetch`, para poder probarlos
// con un doble de prueba.

export class ErrorDeApi extends Error {
  readonly estado: number

  constructor(mensaje: string, estado: number) {
    super(mensaje)
    this.name = 'ErrorDeApi'
    this.estado = estado
  }

  // 0 = no hubo respuesta del servidor (sin internet, API apagada).
  esDeConexion(): boolean {
    return this.estado === 0
  }

  // El dato enviado por la clienta esta mal: hay que corregir el formulario.
  esDeDatos(): boolean {
    return this.estado >= 400 && this.estado < 500
  }

  esDelServidor(): boolean {
    return this.estado >= 500
  }
}

export interface Http {
  obtener<T>(ruta: string): Promise<T>
  publicar<T>(ruta: string, cuerpo: unknown): Promise<T>
}

interface ErrorDelServidor {
  mensaje?: string
  error?: string
}

export class ClienteHttp implements Http {
  private readonly urlBase: string

  constructor(urlBase: string) {
    this.urlBase = urlBase.replace(/\/$/, '')
  }

  obtener<T>(ruta: string): Promise<T> {
    return this.pedir<T>(ruta, { method: 'GET' })
  }

  publicar<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.pedir<T>(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
  }

  private async pedir<T>(ruta: string, opciones: RequestInit): Promise<T> {
    const respuesta = await this.enviar(ruta, opciones)

    if (!respuesta.ok) {
      throw new ErrorDeApi(await this.leerMensajeDeError(respuesta), respuesta.status)
    }
    return (await respuesta.json()) as T
  }

  private async enviar(ruta: string, opciones: RequestInit): Promise<Response> {
    try {
      return await fetch(`${this.urlBase}${ruta}`, opciones)
    } catch {
      throw new ErrorDeApi('No se pudo conectar con el servidor. Revisa tu internet.', 0)
    }
  }

  private async leerMensajeDeError(respuesta: Response): Promise<string> {
    try {
      const cuerpo = (await respuesta.json()) as ErrorDelServidor
      return cuerpo.mensaje ?? cuerpo.error ?? respuesta.statusText
    } catch {
      return respuesta.statusText || 'Ocurrio un error inesperado.'
    }
  }
}
