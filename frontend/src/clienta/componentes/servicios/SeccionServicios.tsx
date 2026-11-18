// Seccion "Servicios" de la pagina publica: muestra el catalogo con su precio y
// duracion, y deja filtrarlo por categoria. Los datos vienen del hook; esta
// seccion solo decide que mostrar segun el estado (cargando, error, vacio).

import { useState } from 'react'
import type { CatalogoServicios } from '../../../compartido/dominio/CatalogoServicios.ts'
import { useCatalogoServicios } from '../../hooks/useCatalogoServicios.ts'
import { SECCIONES } from '../secciones.ts'
import { FiltroDeCategorias } from './FiltroDeCategorias.tsx'
import { TarjetaDeServicio } from './TarjetaDeServicio.tsx'

export function SeccionServicios() {
  const { catalogo, cargando, error, recargar } = useCatalogoServicios()
  const [categoria, setCategoria] = useState<string | null>(null)

  return (
    <section id={SECCIONES.servicios} className="seccion" aria-labelledby="titulo-servicios">
      <div className="contenedor">
        <h2 id="titulo-servicios" className="seccion__titulo">
          Nuestros servicios
        </h2>
        <p className="seccion__introduccion">
          Elige lo que quieras consentirte hoy. Cada servicio indica cuanto dura y su precio.
        </p>

        <ContenidoDelCatalogo
          catalogo={catalogo}
          cargando={cargando}
          error={error}
          recargar={recargar}
          categoria={categoria}
          alCambiarCategoria={setCategoria}
        />
      </div>
    </section>
  )
}

interface PropsDelContenido {
  catalogo: CatalogoServicios
  cargando: boolean
  error: string | null
  recargar: () => void
  categoria: string | null
  alCambiarCategoria: (categoria: string | null) => void
}

function ContenidoDelCatalogo({
  catalogo,
  cargando,
  error,
  recargar,
  categoria,
  alCambiarCategoria,
}: PropsDelContenido) {
  if (cargando) {
    return <p role="status">Cargando servicios...</p>
  }

  if (error) {
    return (
      <div role="alert" className="seccion__aviso">
        <p>{error}</p>
        <button type="button" className="boton boton--chico" onClick={recargar}>
          Intentar de nuevo
        </button>
      </div>
    )
  }

  if (catalogo.estaVacio()) {
    return <p className="seccion__aviso">Pronto publicaremos nuestros servicios.</p>
  }

  const visibles = categoria ? catalogo.filtrarPorCategoria(categoria) : catalogo

  return (
    <>
      <FiltroDeCategorias
        categorias={catalogo.categorias()}
        seleccionada={categoria}
        alSeleccionar={alCambiarCategoria}
      />

      <div className="cuadricula-servicios">
        {visibles.todos().map((servicio) => (
          <TarjetaDeServicio key={servicio.id} servicio={servicio} />
        ))}
      </div>
    </>
  )
}
