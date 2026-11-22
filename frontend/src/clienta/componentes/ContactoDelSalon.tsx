// WhatsApp del salon. Si la duena no puso telefono, no aparece.

import { enlaceDeWhatsApp } from '../../compartido/utils/whatsapp.ts'

interface Props {
  telefono: string | null
}

export function ContactoDelSalon({ telefono }: Props) {
  if (!telefono) return null

  return (
    <a className="contacto" href={enlaceDeWhatsApp(telefono)} target="_blank" rel="noreferrer">
      Escribir al salon por WhatsApp
    </a>
  )
}
