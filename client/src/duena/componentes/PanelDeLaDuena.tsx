// Esqueleto del panel una vez dentro. Aqui se iran agregando las secciones
// (agenda, clientas, servicios, horario, bloqueos, ingresos) con sus hooks.

import type { Sesion } from '../features/sesion/Sesion.ts'

interface Props {
  sesion: Sesion
  onCerrarSesion: () => void
}

export function PanelDeLaDuena({ sesion, onCerrarSesion }: Props) {
  return (
    <main>
      <header>
        <p>Hola, {sesion.nombre}</p>
        <button type="button" onClick={onCerrarSesion}>
          Cerrar sesion
        </button>
      </header>
    </main>
  )
}
