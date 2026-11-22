// Misma regla que el backend: un telefono sirve si tiene suficientes digitos,
// sin importar espacios ni guiones.

const DIGITOS_MINIMOS = 8 // formato de Honduras

export const TELEFONO_INVALIDO = `El telefono debe tener al menos ${DIGITOS_MINIMOS} digitos.`

export function esTelefonoValido(telefono: string): boolean {
  return telefono.replace(/\D/g, '').length >= DIGITOS_MINIMOS
}
