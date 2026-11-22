// Un solo formato de telefono: los 8 digitos de Honduras. "9999-0001",
// "9999 0001" y "+504 99990001" son la misma clienta. Sin esto, cada forma de
// escribirlo tendria su propio historial y su propio maximo de citas.

const CODIGO_DE_HONDURAS = '504';
const DIGITOS_DE_TELEFONO = 8;
const SEPARADORES = /[\s().+-]/g;
const SOLO_DIGITOS = new RegExp(`^\\d{${DIGITOS_DE_TELEFONO}}$`);

export const TELEFONO_INVALIDO = `El telefono debe tener ${DIGITOS_DE_TELEFONO} digitos de Honduras (puede llevar +504).`;

export function normalizarTelefono(telefono: string): string {
  const limpio = telefono.replace(SEPARADORES, '');
  const traeCodigoDePais =
    limpio.length === CODIGO_DE_HONDURAS.length + DIGITOS_DE_TELEFONO && limpio.startsWith(CODIGO_DE_HONDURAS);
  return traeCodigoDePais ? limpio.slice(CODIGO_DE_HONDURAS.length) : limpio;
}

export function esTelefonoValido(telefono: string): boolean {
  return SOLO_DIGITOS.test(normalizarTelefono(telefono));
}
