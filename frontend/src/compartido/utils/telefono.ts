// Misma regla que el backend: 8 digitos de Honduras, con o sin +504, sin
// importar espacios ni guiones.

const SEPARADORES = /[\s().+-]/g
const TELEFONO_DE_HONDURAS = /^(504)?\d{8}$/

export const TELEFONO_INVALIDO = 'El telefono debe tener 8 digitos de Honduras (puede llevar +504).'

export function esTelefonoValido(telefono: string): boolean {
  return TELEFONO_DE_HONDURAS.test(telefono.replace(SEPARADORES, ''))
}

const DIGITOS_LOCALES = 8

// "50499887766" o "9988 7766" -> "9988-7766". Si no es de Honduras, va tal cual.
export function formatearTelefono(telefono: string): string {
  if (!esTelefonoValido(telefono)) return telefono
  const locales = telefono.replace(/\D/g, '').slice(-DIGITOS_LOCALES)
  return `${locales.slice(0, 4)}-${locales.slice(4)}`
}
