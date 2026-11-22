// Editor del horario de atencion y las reglas de reserva. Los cambios se
// guardan todos juntos con "Guardar horario".

import { DIAS_DE_LA_SEMANA, REGLAS_DE_RESERVA } from '../../features/horario/HorarioSemanal.ts'
import { useHorarioDelSalon } from '../../hooks/useHorarioDelSalon.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { ListaDeErrores } from '../../../compartido/componentes/ListaDeErrores.tsx'
import { CampoDeReglaDeReserva } from './CampoDeReglaDeReserva.tsx'
import { FilaDeDia } from './FilaDeDia.tsx'

export function SeccionHorario() {
  const h = useHorarioDelSalon()

  return (
    <section aria-labelledby="titulo-horario">
      <h2 id="titulo-horario">Horario</h2>

      <EstadoDeConsulta cargando={h.cargando || !h.horario} error={h.error}>
        {h.horario && (
          <>
            {!h.horario.yaGuardado && <p role="status">Todavia no configuraste el horario del salon.</p>}

            <fieldset>
              <legend>Dias de atencion</legend>
              {DIAS_DE_LA_SEMANA.map((dia) => (
                <FilaDeDia
                  key={dia.numero}
                  dia={dia}
                  horas={h.horario!.horasDel(dia.numero)}
                  onAbrir={(horas) => h.abrirDia(dia.numero, horas)}
                  onCerrar={() => h.cerrarDia(dia.numero)}
                />
              ))}
            </fieldset>

            <fieldset>
              <legend>Reglas de reserva</legend>

              {REGLAS_DE_RESERVA.map((regla) => (
                <CampoDeReglaDeReserva
                  key={regla.campo}
                  regla={regla}
                  valor={h.horario!.valorDe(regla.campo)}
                  onCambiar={(valor) => h.cambiarRegla(regla.campo, valor)}
                />
              ))}

              <label htmlFor="horario-zona">Zona horaria</label>
              <input
                id="horario-zona"
                value={h.horario.zonaHoraria}
                onChange={(e) => h.cambiarZonaHoraria(e.target.value)}
              />
            </fieldset>

            <ListaDeErrores errores={h.errores.length > 0 ? h.errores : h.horario.errores()} />

            <button
              type="button"
              onClick={() => void h.guardar()}
              disabled={h.guardando || !h.hayCambiosSinGuardar || !h.horario.estaCompleto()}
            >
              {h.guardando ? 'Guardando...' : 'Guardar horario'}
            </button>
            <button type="button" onClick={h.descartarCambios} disabled={h.guardando || !h.hayCambiosSinGuardar}>
              Descartar cambios
            </button>
          </>
        )}
      </EstadoDeConsulta>
    </section>
  )
}
