// Fechas como texto YYYY-MM-DD, igual que en el frontend y en las columnas
// DATE de PostgreSQL. Se comparan como texto porque el formato lo permite.

const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export function esFechaValida(fecha: string): boolean {
  const partes = FORMATO_FECHA.exec(fecha);
  if (!partes) return false;

  const [anio, mes, dia] = partes.slice(1).map(Number);
  const candidata = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    candidata.getUTCFullYear() === anio &&
    candidata.getUTCMonth() === mes - 1 &&
    candidata.getUTCDate() === dia
  );
}

export function esHoraValida(hora: string): boolean {
  return FORMATO_HORA.test(hora);
}

// Cantidad de dias entre dos fechas validas (hasta - desde).
export function diasEntre(desde: string, hasta: string): number {
  return (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / MILISEGUNDOS_POR_DIA;
}
