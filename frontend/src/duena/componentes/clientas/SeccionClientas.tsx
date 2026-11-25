// Directorio de clientas con buscador y el historial de la elegida.

import { useState } from 'react'
import { useClientas } from '../../hooks/useClientas.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { DetalleDeClienta } from './DetalleDeClienta.tsx'

export function SeccionClientas() {
  const { clientas, busqueda, buscar, cargando, error, recargar } = useClientas()
  const [clientaElegida, setClientaElegida] = useState<number | null>(null)

  return (
    <section className="clientas" aria-labelledby="titulo-clientas">
      <h2 id="titulo-clientas">Clientas</h2>

      <div className="clientas__buscador">
        <label htmlFor="buscar-clienta">Buscar por nombre o telefono</label>
        <input
          id="buscar-clienta"
          type="search"
          value={busqueda}
          onChange={(evento) => buscar(evento.target.value)}
        />
      </div>

      <div className="clientas__lista">
        <EstadoDeConsulta cargando={cargando} error={error} onReintentar={recargar}>
          {clientas.estaVacio() ? (
            <p className="clientas__vacio">No hay clientas que coincidan.</p>
          ) : (
            <ul className="directorio">
              {clientas.todas().map((clienta) => (
                <li key={clienta.id}>
                  <button
                    type="button"
                    className="directorio__clienta"
                    aria-pressed={clienta.id === clientaElegida}
                    onClick={() => setClientaElegida(clienta.id)}
                  >
                    <span className="directorio__nombre">{clienta.nombre}</span>
                    <span className="directorio__telefono">{clienta.telefono}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </EstadoDeConsulta>
      </div>

      {clientaElegida === null ? (
        <p className="ficha-clienta ficha-clienta--sin-elegir">Elige una clienta para ver su historial.</p>
      ) : (
        <DetalleDeClienta clientaId={clientaElegida} onCerrar={() => setClientaElegida(null)} />
      )}
    </section>
  )
}
