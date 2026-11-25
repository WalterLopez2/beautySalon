// Aviso despues de crear un bloqueo: citas que ya estaban agendadas en ese
// tramo y que la duena tiene que reprogramar o cancelar desde la agenda.

import type { CitaDelPanel } from '../../features/agenda/CitaDelPanel.ts'

interface Props {
  citas: readonly CitaDelPanel[]
  onEntendido: () => void
}

export function CitasAfectadas({ citas, onEntendido }: Props) {
  if (citas.length === 0) return null

  return (
    <div className="aviso-panel aviso-panel--alerta" role="alert">
      <p>Estas citas ya estaban agendadas en el tramo bloqueado:</p>
      <ul className="aviso-panel__lista">
        {citas.map((item) => (
          <li key={item.id}>
            {item.nombreEscrito} - {item.cita.resumen()}{' '}
            <a href={item.clienta.enlaceDeWhatsApp()} target="_blank" rel="noreferrer">
              Avisarle
            </a>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onEntendido}>
        Entendido
      </button>
    </div>
  )
}
