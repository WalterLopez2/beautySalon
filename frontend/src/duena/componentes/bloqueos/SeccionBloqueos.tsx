// Dias libres y bloqueos de horas. Muestra los de los proximos 12 meses y,
// al crear uno, avisa que citas ya estaban agendadas en ese tramo.

import { useState } from 'react'
import { sumarDias } from '../../../compartido/utils/fecha.ts'
import { BorradorDeBloqueo } from '../../features/bloqueos/BorradorDeBloqueo.ts'
import { useBloqueos } from '../../hooks/useBloqueos.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { CitasAfectadas } from './CitasAfectadas.tsx'
import { FormularioDeBloqueo } from './FormularioDeBloqueo.tsx'

const DIAS_A_MOSTRAR = 365

interface Props {
  fecha: string
}

export function SeccionBloqueos({ fecha }: Props) {
  const b = useBloqueos(fecha, sumarDias(fecha, DIAS_A_MOSTRAR))
  const [borrador, setBorrador] = useState<BorradorDeBloqueo | null>(null)

  async function enviar(): Promise<void> {
    if (borrador && (await b.crear(borrador))) setBorrador(null)
  }

  return (
    <section aria-labelledby="titulo-bloqueos">
      <div className="encabezado-seccion">
        <h2 id="titulo-bloqueos">Dias libres</h2>
        <button type="button" onClick={() => setBorrador(BorradorDeBloqueo.para(fecha))}>
          Bloquear dias u horas
        </button>
      </div>

      {borrador && (
        <FormularioDeBloqueo
          borrador={borrador}
          guardando={b.guardando}
          errores={b.errores}
          onCambiar={setBorrador}
          onEnviar={() => void enviar()}
          onCancelar={() => setBorrador(null)}
        />
      )}

      <CitasAfectadas citas={b.citasAfectadas} onEntendido={b.olvidarCitasAfectadas} />

      <EstadoDeConsulta cargando={b.cargando} error={b.error} onReintentar={b.recargar}>
        {b.bloqueos.length === 0 ? (
          <p className="seccion-vacia">No hay bloqueos en los proximos dias.</p>
        ) : (
          <ul className="bloqueos">
            {b.bloqueos.map((bloqueo) => (
              <li key={bloqueo.id} className="bloqueo">
                <div>
                  <p className="bloqueo__cuando">{bloqueo.resumen()}</p>
                  {bloqueo.motivo && <p className="bloqueo__motivo">{bloqueo.motivo}</p>}
                </div>
                <button type="button" onClick={() => void b.eliminar(bloqueo)} disabled={b.guardando}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </EstadoDeConsulta>
    </section>
  )
}
