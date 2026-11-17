// Agenda del dia: resumen (por confirmar, cobrado, esperado) y la lista de
// citas con sus acciones.

import { formatearLempiras } from '../../../compartido/utils/formato.ts'
import { useAgendaDelPanel } from '../../hooks/useAgendaDelPanel.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { SelectorDeFecha } from '../SelectorDeFecha.tsx'
import { TarjetaDeCita } from './TarjetaDeCita.tsx'

interface Props {
  fecha: string
  onCambiarFecha: (fecha: string) => void
}

export function SeccionAgenda({ fecha, onCambiarFecha }: Props) {
  const { agenda, cargando, error, recargar, citaEnProceso, errorDeAccion, cambiarEstado } =
    useAgendaDelPanel(fecha)

  return (
    <section aria-labelledby="titulo-agenda">
      <h2 id="titulo-agenda">Agenda</h2>
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
                  onCambiarEstado={(estado) => void cambiarEstado(item, estado)}
                />
              </li>
            ))}
          </ol>
        )}
      </EstadoDeConsulta>
    </section>
  )
}
