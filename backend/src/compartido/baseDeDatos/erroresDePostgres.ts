// Codigos de error de PostgreSQL que el sistema traduce a mensajes claros.

export const VIOLACION_DE_UNICIDAD = '23505';
export const VIOLACION_DE_EXCLUSION = '23P01'; // dos citas en la misma hora

export function esErrorDePostgres(error: unknown, codigo: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === codigo;
}
