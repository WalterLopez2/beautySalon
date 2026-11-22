// Hasta donde llega cada dato. Son los topes de las columnas: revisarlos al
// entrar da un 400 claro en vez de un error 500 de la base de datos.

export const LARGO_MAXIMO = {
  nombre: 120,
  correo: 254,
  telefono: 30, // como lo escriben; se guarda con 8 digitos
  codigo: 40, // con espacios o guiones
  usuario: 60,
  categoria: 60,
  zonaHoraria: 64,
  motivo: 200,
  descripcion: 2000,
} as const;

export const ENTERO_MAXIMO = 2_147_483_647; // INTEGER de PostgreSQL
export const MONTO_MAXIMO = 99_999_999.99; // NUMERIC(10, 2)
export const DURACION_MAXIMA = 24 * 60; // una cita no dura mas de un dia
