// Errores de validacion o del servidor al enviar un formulario. Lo usan las
// dos vistas; cada una le da estilo a `.lista-de-errores` en su propio CSS.

interface Props {
  errores: readonly string[]
}

export function ListaDeErrores({ errores }: Props) {
  if (errores.length === 0) return null

  return (
    <ul className="lista-de-errores" role="alert">
      {errores.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  )
}
