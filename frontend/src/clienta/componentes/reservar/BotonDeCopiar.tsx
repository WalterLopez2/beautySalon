// Copia un texto al portapapeles y avisa que se copio. Si el navegador no
// permite el portapapeles (por ejemplo, fuera de HTTPS), el boton no aparece:
// la clienta igual puede copiar el texto a mano.

import { useState } from 'react'

interface Props {
  texto: string
  etiqueta: string
}

function portapapelesDisponible(): boolean {
  return typeof navigator !== 'undefined' && navigator.clipboard !== undefined
}

export function BotonDeCopiar({ texto, etiqueta }: Props) {
  const [copiado, setCopiado] = useState(false)

  if (!portapapelesDisponible()) return null

  async function copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      setCopiado(false) // permiso negado: queda la opcion de copiarlo a mano
    }
  }

  return (
    <button type="button" className="boton boton--chico boton--secundario" onClick={() => void copiar()}>
      <span aria-live="polite">{copiado ? 'Copiado' : etiqueta}</span>
    </button>
  )
}
