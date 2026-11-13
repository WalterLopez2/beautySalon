// Los telefonos se guardan solo con digitos: "9999-0001" y "9999 0001" son la
// misma clienta. Sin esto, el historial por telefono fallaria por un guion.

export const DIGITOS_MINIMOS_DE_TELEFONO = 8; // formato de Honduras

export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, '');
}

export function esTelefonoValido(telefono: string): boolean {
  return normalizarTelefono(telefono).length >= DIGITOS_MINIMOS_DE_TELEFONO;
}
