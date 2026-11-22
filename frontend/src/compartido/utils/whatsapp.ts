// Enlace para escribir por WhatsApp. Lo usan las dos vistas.

const CODIGO_HONDURAS = '504'
const DIGITOS_LOCALES = 8

export function enlaceDeWhatsApp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '')
  return `https://wa.me/${digitos.length === DIGITOS_LOCALES ? CODIGO_HONDURAS : ''}${digitos}`
}
