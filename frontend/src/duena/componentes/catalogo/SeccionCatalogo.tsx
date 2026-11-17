// Servicios del salon: lista, crear, editar y pausar/reactivar.

import { useState } from 'react'
import { BorradorDeServicio } from '../../features/catalogo/BorradorDeServicio.ts'
import type { ServicioDelPanel } from '../../features/catalogo/ServicioDelPanel.ts'
import { useCatalogoDelPanel } from '../../hooks/useCatalogoDelPanel.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { FormularioDeServicio } from './FormularioDeServicio.tsx'

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
      <h2 id="titulo-catalogo">Servicios</h2>

      <button type="button" onClick={() => setEdicion({ borrador: BorradorDeServicio.vacio() })}>
        Nuevo servicio
      </button>

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
          <p>Todavia no hay servicios.</p>
        ) : (
          <ul>
            {servicios.map((item) => (
              <li key={item.id}>
                <h3>{item.servicio.nombre}</h3>
                <p>
                  {item.servicio.precioFormateado()} - {item.servicio.duracionFormateada()}
                </p>
                {item.estaPausado() && <p>Pausado</p>}
                <button type="button" onClick={() => editar(item)} disabled={guardando}>
                  Editar
                </button>
                <button type="button" onClick={() => void cambiarActivo(item)} disabled={guardando}>
                  {item.estaPausado() ? 'Reactivar' : 'Pausar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </EstadoDeConsulta>
    </section>
  )
}
