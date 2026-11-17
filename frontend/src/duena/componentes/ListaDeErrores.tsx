// Errores de validacion o del servidor al guardar un formulario.

interface Props {
  errores: readonly string[]
}

export function ListaDeErrores({ errores }: Props) {
  if (errores.length === 0) return null

  return (
    <ul role="alert">
      {errores.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  )
}
