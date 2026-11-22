// Un error que se puede reintentar sin recargar la pagina ni perder lo escrito.

interface Props {
  mensaje: string
  alReintentar: () => void
}

export function AvisoConReintento({ mensaje, alReintentar }: Props) {
  return (
    <div className="aviso" role="alert">
      <p>{mensaje}</p>
      <button type="button" className="boton boton--chico" onClick={alReintentar}>
        Intentar de nuevo
      </button>
    </div>
  )
}
