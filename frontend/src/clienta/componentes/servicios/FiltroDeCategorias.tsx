// Botones para filtrar el catalogo por categoria. `null` significa "todas".
// Son botones de alternar (aria-pressed): uno solo queda activo a la vez.

interface Props {
  categorias: readonly string[]
  seleccionada: string | null
  alSeleccionar: (categoria: string | null) => void
}

const TODAS = 'Todos'

export function FiltroDeCategorias({ categorias, seleccionada, alSeleccionar }: Props) {
  const opciones: ReadonlyArray<{ valor: string | null; texto: string }> = [
    { valor: null, texto: TODAS },
    ...categorias.map((categoria) => ({ valor: categoria, texto: categoria })),
  ]

  return (
    <div className="filtro-categorias" role="group" aria-label="Filtrar por categoria">
      {opciones.map((opcion) => (
        <button
          key={opcion.texto}
          type="button"
          className="filtro-categorias__opcion"
          aria-pressed={opcion.valor === seleccionada}
          onClick={() => alSeleccionar(opcion.valor)}
        >
          {opcion.texto}
        </button>
      ))}
    </div>
  )
}
