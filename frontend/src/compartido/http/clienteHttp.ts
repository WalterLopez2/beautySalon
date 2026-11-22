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

  // Sesion vencida o ausente: la duena tiene que volver a iniciar sesion.
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

// Se llama cuando el servidor responde 401. La sesion viaja en una cookie que
// JavaScript no ve; quien crea el cliente decide si un 401 es "sesion perdida".
export type AlPerderLaSesion = () => void

// La API lo exige en las acciones del panel (CSRF): otro sitio no puede mandarlo.
const ENCABEZADO_PROPIO = 'X-Salon-Peticion'

const SIN_CONTENIDO = 204
const RESPUESTA_INVALIDA = 502 // llego algo que no es JSON (la pagina de error de un proxy)
const SIN_RESPUESTA = 0
// Un poco mas de lo que espera la API a su base de datos.
const TIEMPO_MAXIMO_MS = 20_000
const SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu internet.'
// No se puede prometer que no se guardo: la respuesta pudo perderse al volver.
const TARDO_DEMASIADO =
  'El servidor tardo demasiado en responder. Intenta de nuevo; si estabas guardando algo, revisa primero si se guardo.'
const NO_SE_ENTENDIO = 'El servidor respondio algo inesperado. Intenta de nuevo en un momento.'
const NO_AUTORIZADO = 401

interface ErrorDelServidor {
  mensaje?: string
  error?: string
}

export class ClienteHttp implements Http {
  private readonly urlBase: string
  private readonly alPerderLaSesion: AlPerderLaSesion

  constructor(urlBase: string, alPerderLaSesion: AlPerderLaSesion = () => {}) {
    this.urlBase = urlBase.replace(/\/$/, '')
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
    const limite = new AbortController()
    const reloj = setTimeout(() => limite.abort(), TIEMPO_MAXIMO_MS)
    try {
      return await this.pedirConLimite<T>(ruta, { ...conEncabezadoPropio(opciones), signal: limite.signal })
    } catch (causa) {
      if (!limite.signal.aborted) throw causa
      throw new ErrorDeApi(TARDO_DEMASIADO, SIN_RESPUESTA)
    } finally {
      clearTimeout(reloj)
    }
  }

  private async pedirConLimite<T>(ruta: string, opciones: RequestInit): Promise<T> {
    const respuesta = await this.enviar(ruta, opciones)

    if (respuesta.status === NO_AUTORIZADO) {
      this.alPerderLaSesion()
    }
    if (!respuesta.ok) {
      throw new ErrorDeApi(await this.leerMensajeDeError(respuesta), respuesta.status)
    }
    // 204 = todo bien, sin cuerpo (por ejemplo, al eliminar).
    if (respuesta.status === SIN_CONTENIDO) return undefined as T
    try {
      return (await respuesta.json()) as T
    } catch {
      throw new ErrorDeApi(NO_SE_ENTENDIO, RESPUESTA_INVALIDA)
    }
  }

  private async enviar(ruta: string, opciones: RequestInit): Promise<Response> {
    try {
      return await fetch(`${this.urlBase}${ruta}`, opciones)
    } catch {
      throw new ErrorDeApi(SIN_CONEXION, SIN_RESPUESTA)
    }
  }

  private async leerMensajeDeError(respuesta: Response): Promise<string> {
    try {
      const cuerpo = (await respuesta.json()) as ErrorDelServidor
      return cuerpo.mensaje ?? cuerpo.error ?? NO_SE_ENTENDIO
    } catch {
      return NO_SE_ENTENDIO
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

function conEncabezadoPropio(opciones: RequestInit): RequestInit {
  const headers = new Headers(opciones.headers)
  headers.set(ENCABEZADO_PROPIO, '1')
  return { ...opciones, headers }
}
