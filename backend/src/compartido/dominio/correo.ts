const FORMATO_DE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esCorreoValido(correo: string): boolean {
  return FORMATO_DE_CORREO.test(correo);
}
