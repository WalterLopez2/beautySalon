// Directorio de clientas con buscador y el historial de la elegida.

import { useState } from 'react'
import { useClientas } from '../../hooks/useClientas.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { DetalleDeClienta } from './DetalleDeClienta.tsx'

export function SeccionClientas() {
  const { clientas, busqueda, buscar, cargando, error, recargar } = useClientas()
  const [clientaElegida, setClientaElegida] = useState<number | null>(null)

  return (
    <section aria-labelledby="titulo-clientas">
      <h2 id="titulo-clientas">Clientas</h2>

      <label htmlFor="buscar-clienta">Buscar por nombre o telefono</label>
      <input
        id="buscar-clienta"
        type="search"
        value={busqueda}
        onChange={(evento) => buscar(evento.target.value)}
      />

      <EstadoDeConsulta cargando={cargando} error={error} onReintentar={recargar}>
        {clientas.estaVacio() ? (
          <p>No hay clientas que coincidan.</p>
        ) : (
          <ul>
            {clientas.todas().map((clienta) => (
              <li key={clienta.id}>
                <button
                  type="button"
                  aria-pressed={clienta.id === clientaElegida}
                  onClick={() => setClientaElegida(clienta.id)}
                >
                  {clienta.nombre} - {clienta.telefono}
                </button>
              </li>
            ))}
          </ul>
        )}
      </EstadoDeConsulta>

      {clientaElegida !== null && (
        <DetalleDeClienta clientaId={clientaElegida} onCerrar={() => setClientaElegida(null)} />
      )}
    </section>
  )
}
