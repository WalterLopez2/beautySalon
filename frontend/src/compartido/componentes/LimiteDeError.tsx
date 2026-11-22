// Si una vista no se puede descargar o falla al dibujarse, muestra como
// recuperarse en vez de una pantalla en blanco. Tiene que ser una clase: React
// no ofrece esto con hooks.

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface Estado {
  fallo: boolean
}

export class LimiteDeError extends Component<Props, Estado> {
  state: Estado = { fallo: false }

  static getDerivedStateFromError(): Estado {
    return { fallo: true }
  }

  render(): ReactNode {
    if (!this.state.fallo) return this.props.children

    return (
      <main className="pantalla-de-error" role="alert">
        <h1>No pudimos mostrar la pagina</h1>
        <p>Revisa tu internet y vuelve a cargarla.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Recargar la pagina
        </button>
      </main>
    )
  }
}
