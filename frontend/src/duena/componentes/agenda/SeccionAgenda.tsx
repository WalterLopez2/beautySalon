// Agenda: lo que falta confirmar de cualquier dia y, del dia elegido, su
// resumen y la lista de citas con sus acciones.

import type { EstadoCita } from '../../../compartido/tipos/api.ts'
import { formatearLempiras } from '../../../compartido/utils/formato.ts'
import { useAgendaDelPanel } from '../../hooks/useAgendaDelPanel.ts'
import { useSolicitudesPorConfirmar } from '../../hooks/useSolicitudesPorConfirmar.ts'
import type { CitaDelPanel } from '../../features/agenda/CitaDelPanel.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { SelectorDeFecha } from '../SelectorDeFecha.tsx'
import { SolicitudesPorConfirmar } from './SolicitudesPorConfirmar.tsx'
import { TarjetaDeCita } from './TarjetaDeCita.tsx'

interface Props {
  fecha: string
  onCambiarFecha: (fecha: string) => void
}

export function SeccionAgenda({ fecha, onCambiarFecha }: Props) {
  const { agenda, cargando, error, recargar, citaEnProceso, errorDeAccion, cambiarEstado } =
    useAgendaDelPanel(fecha)
  const porConfirmar = useSolicitudesPorConfirmar()

  async function cambiarYActualizar(item: CitaDelPanel, estado: EstadoCita): Promise<void> {
    await cambiarEstado(item, estado)
    porConfirmar.recargar()
  }

  return (
    <section aria-labelledby="titulo-agenda">
      <h2 id="titulo-agenda">Agenda</h2>
      <SolicitudesPorConfirmar
        solicitudes={porConfirmar.solicitudes}
        cargando={porConfirmar.cargando}
        error={porConfirmar.error}
        onReintentar={porConfirmar.recargar}
        onVerDia={onCambiarFecha}
      />
      <SelectorDeFecha fecha={fecha} onCambiar={onCambiarFecha} />

      <EstadoDeConsulta cargando={cargando} error={error} onReintentar={recargar}>
        <dl>
          <dt>Por confirmar</dt>
          <dd>{agenda.porConfirmar().length}</dd>
          <dt>Cobrado</dt>
          <dd>{formatearLempiras(agenda.ingresoCobrado())}</dd>
          <dt>Esperado</dt>
          <dd>{formatearLempiras(agenda.ingresoEsperado())}</dd>
        </dl>

        {errorDeAccion && <p role="alert">{errorDeAccion}</p>}

        {agenda.estaVacia() ? (
          <p>No hay citas este dia.</p>
        ) : (
          <ol>
            {agenda.todas().map((item) => (
              <li key={item.id}>
                <TarjetaDeCita
                  item={item}
                  enProceso={citaEnProceso === item.id}
                  onCambiarEstado={(estado) => void cambiarYActualizar(item, estado)}
                />
              </li>
            ))}
          </ol>
        )}
      </EstadoDeConsulta>
    </section>
  )
}
