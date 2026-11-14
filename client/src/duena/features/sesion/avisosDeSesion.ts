// Aviso de "la sesion se perdio" entre el cliente HTTP (que detecta el 401) y
// React (que tiene que volver al login). Asi el cliente HTTP no depende de
// React ni React del cliente HTTP: los dos solo conocen este aviso.

type Oyente = () => void

export class AvisosDeSesion {
  private readonly oyentes = new Set<Oyente>()

  // Devuelve la funcion para dejar de escuchar (ideal para useEffect).
  alPerderse(oyente: Oyente): () => void {
    this.oyentes.add(oyente)
    return () => {
      this.oyentes.delete(oyente)
    }
  }

  avisarQueSePerdio(): void {
    for (const oyente of this.oyentes) oyente()
  }
}
