// Resumen de ingresos de la semana: total, por dia y servicios mas vendidos.

import { formatearFecha, formatearLempiras } from '../../../compartido/utils/formato.ts'
import { useResumenDeIngresos } from '../../hooks/useResumenDeIngresos.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { SelectorDeFecha } from '../SelectorDeFecha.tsx'

interface Props {
  fecha: string
  onCambiarFecha: (fecha: string) => void
}

export function SeccionIngresos({ fecha, onCambiarFecha }: Props) {
  const { resumen, cargando, error, recargar } = useResumenDeIngresos(fecha)

  return (
    <section aria-labelledby="titulo-ingresos">
      <h2 id="titulo-ingresos">Ingresos</h2>
      <SelectorDeFecha fecha={fecha} onCambiar={onCambiarFecha} paso={7} />
      <p>
        Semana del {formatearFecha(resumen.desde())} al {formatearFecha(resumen.hasta())}
      </p>

      <EstadoDeConsulta cargando={cargando} error={error} onReintentar={recargar}>
        <dl>
          <dt>Total de la semana</dt>
          <dd>{formatearLempiras(resumen.totalDeLaSemana())}</dd>
          <dt>Promedio por cita</dt>
          <dd>{formatearLempiras(resumen.promedioPorCita())}</dd>
        </dl>

        <table>
          <caption>Por dia</caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">Citas atendidas</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {resumen.porDia().map((dia) => (
              <tr key={dia.fecha}>
                <th scope="row">{formatearFecha(dia.fecha)}</th>
                <td>{dia.citasAtendidas}</td>
                <td>{formatearLempiras(dia.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Servicios mas vendidos</h3>
        {resumen.serviciosMasVendidos().length === 0 ? (
          <p>Sin ventas esta semana.</p>
        ) : (
          <ol>
            {resumen.serviciosMasVendidos().map((s) => (
              <li key={s.servicioNombre}>
                {s.servicioNombre} - {s.veces} - {formatearLempiras(s.total)}
              </li>
            ))}
          </ol>
        )}
      </EstadoDeConsulta>
    </section>
  )
}
