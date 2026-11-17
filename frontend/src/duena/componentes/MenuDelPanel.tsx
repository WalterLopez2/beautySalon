// Menu de secciones del panel. Botones (no enlaces): cambiar de seccion no
// cambia la direccion, todo vive dentro de /panel.

import { SECCIONES_DEL_PANEL, type IdDeSeccion } from './secciones.ts'

interface Props {
  seccionActual: IdDeSeccion
  onElegir: (seccion: IdDeSeccion) => void
}

export function MenuDelPanel({ seccionActual, onElegir }: Props) {
  return (
    <nav aria-label="Secciones del panel">
      <ul>
        {SECCIONES_DEL_PANEL.map(({ id, texto }) => (
          <li key={id}>
            <button
              type="button"
              aria-current={id === seccionActual ? 'page' : undefined}
              aria-controls="contenido-del-panel"
              onClick={() => onElegir(id)}
            >
              {texto}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
