// Seccion "Servicios" de la pagina publica: muestra el catalogo como una carta,
// agrupado por categoria, con su precio y duracion, y deja filtrarlo. El catalogo llega por props (lo
// carga la vista una sola vez); esta seccion solo decide que mostrar segun el
// estado (cargando, error, vacio).

import { useState } from 'react'
import type { CatalogoEnPantalla } from '../../hooks/useCatalogoServicios.ts'
import { AvisoConReintento } from '../AvisoConReintento.tsx'
import { SECCIONES } from '../secciones.ts'
import { FiltroDeCategorias } from './FiltroDeCategorias.tsx'
import { ServicioDeLaCarta } from './ServicioDeLaCarta.tsx'

interface Props {
  catalogoEnPantalla: CatalogoEnPantalla
}

export function SeccionServicios({ catalogoEnPantalla }: Props) {
  return (
    <section id={SECCIONES.servicios} className="seccion" aria-labelledby="titulo-servicios">
      <div className="contenedor">
        <h2 id="titulo-servicios" className="seccion__titulo">
          Nuestros servicios
        </h2>
        <p className="seccion__introduccion">
          Elige lo que quieras consentirte hoy. Cada servicio indica cuanto dura y su precio.
        </p>

        <ContenidoDelCatalogo {...catalogoEnPantalla} />
      </div>
    </section>
  )
}

function ContenidoDelCatalogo({ catalogo, cargando, error, recargar }: CatalogoEnPantalla) {
  const [categoria, setCategoria] = useState<string | null>(null)

  if (cargando) {
    return <p className="seccion__aviso" role="status">Cargando servicios...</p>
  }

  if (error) {
    return <AvisoConReintento mensaje={error} alReintentar={recargar} />
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
        alSeleccionar={setCategoria}
      />

      <div className="carta">
        {visibles.agrupadosPorCategoria().map(({ categoria, servicios }) => (
          <section key={categoria} className="carta__grupo" aria-label={categoria}>
            <h3 className="carta__categoria">{categoria}</h3>
            <ul className="carta__servicios">
              {servicios.map((servicio) => (
                <ServicioDeLaCarta key={servicio.id} servicio={servicio} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
