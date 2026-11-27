// Boton redondo de WhatsApp fijo en la esquina, para escribirle al salon
// desde cualquier parte de la pagina. Si la duena no puso telefono, no aparece.

import { enlaceDeWhatsApp } from '../../compartido/utils/whatsapp.ts'

interface Props {
  telefono: string | null
}

export function BotonDeWhatsApp({ telefono }: Props) {
  if (!telefono) return null

  return (
    <a
      className="boton-whatsapp"
      href={enlaceDeWhatsApp(telefono)}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir al salon por WhatsApp"
    >
      {/* Globo de conversacion, dibujado aqui: la CSP no deja cargar iconos de afuera. */}
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path
          d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  )
}
