// Servicios del salon: lista, crear, editar y pausar/reactivar.

import { useState } from 'react'
import { BorradorDeServicio } from '../../features/catalogo/BorradorDeServicio.ts'
import type { ServicioDelPanel } from '../../features/catalogo/ServicioDelPanel.ts'
import { useCatalogoDelPanel } from '../../hooks/useCatalogoDelPanel.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { FormularioDeServicio } from './FormularioDeServicio.tsx'
import { TarjetaDeServicio } from './TarjetaDeServicio.tsx'

// null = formulario cerrado; id undefined = servicio nuevo.
type Edicion = { borrador: BorradorDeServicio; id?: number } | null

export function SeccionCatalogo() {
  const { servicios, cargando, error, recargar, guardando, errores, guardar, cambiarActivo } =
    useCatalogoDelPanel()
  const [edicion, setEdicion] = useState<Edicion>(null)

  function editar(item: ServicioDelPanel): void {
    setEdicion({ borrador: BorradorDeServicio.desdeServicio(item.servicio), id: item.id })
  }

  async function enviar(): Promise<void> {
    if (edicion && (await guardar(edicion.borrador, edicion.id))) setEdicion(null)
  }

  return (
    <section aria-labelledby="titulo-catalogo">
      <div className="encabezado-seccion">
        <h2 id="titulo-catalogo">Servicios</h2>
        <button type="button" onClick={() => setEdicion({ borrador: BorradorDeServicio.vacio() })}>
          Nuevo servicio
        </button>
      </div>

      {edicion && (
        <FormularioDeServicio
          borrador={edicion.borrador}
          esNuevo={edicion.id === undefined}
          guardando={guardando}
          errores={errores}
          onCambiar={(borrador) => setEdicion({ ...edicion, borrador })}
          onEnviar={() => void enviar()}
          onCancelar={() => setEdicion(null)}
        />
      )}

      <EstadoDeConsulta cargando={cargando} error={error} onReintentar={recargar}>
        {servicios.length === 0 ? (
          <p className="seccion-vacia">Todavia no hay servicios.</p>
        ) : (
          <ul className="servicios-del-panel">
            {servicios.map((item) => (
              <li key={item.id}>
                <TarjetaDeServicio
                  item={item}
                  guardando={guardando}
                  onEditar={() => editar(item)}
                  onCambiarActivo={() => void cambiarActivo(item)}
                />
              </li>
            ))}
          </ul>
        )}
      </EstadoDeConsulta>
    </section>
  )
}
