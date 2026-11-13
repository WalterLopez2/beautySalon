// Quita acentos y mayusculas para que "pestanas" encuentre "Pestañas" y
// "maria" encuentre "María" en los buscadores.
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase()
    .trim()
}
