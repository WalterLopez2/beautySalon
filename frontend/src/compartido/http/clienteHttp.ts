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

  // Token vencido o ausente: la duena tiene que volver a iniciar sesion.
  esDeSesion(): boolean {
    return this.estado === 401
  }
}

export interface Http {
  obtener<T>(ruta: string): Promise<T>
  publicar<T>(ruta: string, cuerpo: unknown): Promise<T>
  actualizar<T>(ruta: string, cuerpo: unknown): Promise<T>
  reemplazar<T>(ruta: string, cuerpo: unknown): Promise<T>
  eliminar(ruta: string): Promise<void>
}

// Quien sabe el token de la sesion actual. Las rutas publicas funcionan igual
// cuando devuelve null.
export type ProveedorDeToken = () => string | null

// Se llama cuando el servidor rechaza un token que SI se envio (vencido,
// revocado o falso), para que la app cierre la sesion local y vuelva al login.
export type AlPerderLaSesion = () => void

const SIN_CONTENIDO = 204
const NO_AUTORIZADO = 401

interface ErrorDelServidor {
  mensaje?: string
  error?: string
}

export class ClienteHttp implements Http {
  private readonly urlBase: string
  private readonly token: ProveedorDeToken
  private readonly alPerderLaSesion: AlPerderLaSesion

  constructor(
    urlBase: string,
    token: ProveedorDeToken = () => null,
    alPerderLaSesion: AlPerderLaSesion = () => {},
  ) {
    this.urlBase = urlBase.replace(/\/$/, '')
    this.token = token
    this.alPerderLaSesion = alPerderLaSesion
  }

  obtener<T>(ruta: string): Promise<T> {
    return this.pedir<T>(ruta, { method: 'GET' })
  }

  publicar<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.pedir<T>(ruta, conCuerpoJson('POST', cuerpo))
  }

  // PATCH: cambia una parte (por ejemplo, solo el estado de una cita).
  actualizar<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.pedir<T>(ruta, conCuerpoJson('PATCH', cuerpo))
  }

  // PUT: reemplaza el recurso completo (por ejemplo, todo el horario).
  reemplazar<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.pedir<T>(ruta, conCuerpoJson('PUT', cuerpo))
  }

  async eliminar(ruta: string): Promise<void> {
    await this.pedir<void>(ruta, { method: 'DELETE' })
  }

  private async pedir<T>(ruta: string, opciones: RequestInit): Promise<T> {
    const token = this.token()
    const respuesta = await this.enviar(ruta, conToken(opciones, token))

    // Un 401 sin token es un login fallido, no una sesion perdida.
    if (respuesta.status === NO_AUTORIZADO && token) {
      this.alPerderLaSesion()
    }
    if (!respuesta.ok) {
      throw new ErrorDeApi(await this.leerMensajeDeError(respuesta), respuesta.status)
    }
    // 204 = todo bien, sin cuerpo (por ejemplo, al eliminar).
    if (respuesta.status === SIN_CONTENIDO) return undefined as T
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

function conCuerpoJson(method: 'POST' | 'PATCH' | 'PUT', cuerpo: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }
}

function conToken(opciones: RequestInit, token: string | null): RequestInit {
  if (!token) return opciones

  const headers = new Headers(opciones.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return { ...opciones, headers }
}
