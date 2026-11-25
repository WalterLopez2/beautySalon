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
            {!h.horario.yaGuardado && (
              <p className="aviso-panel" role="status">
                Todavia no configuraste el horario del salon. Mientras tanto, las clientas lo ven cerrado.
              </p>
            )}

            <fieldset className="grupo-panel">
              <legend className="grupo-panel__titulo">Dias de atencion</legend>
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

            <fieldset className="grupo-panel grupo-panel--en-cuadricula">
              <legend className="grupo-panel__titulo">Reglas de reserva</legend>

              {REGLAS_DE_RESERVA.map((regla) => (
                <CampoDeReglaDeReserva
                  key={regla.campo}
                  regla={regla}
                  valor={h.horario!.valorDe(regla.campo)}
                  onCambiar={(valor) => h.cambiarRegla(regla.campo, valor)}
                />
              ))}

              <div className="campo-panel">
                <label htmlFor="horario-zona">Zona horaria</label>
                <input
                  id="horario-zona"
                  aria-describedby="horario-zona-ayuda"
                  value={h.horario.zonaHoraria}
                  onChange={(e) => h.cambiarZonaHoraria(e.target.value)}
                />
                <p id="horario-zona-ayuda" className="campo-panel__ayuda">
                  Con ella se calcula la fecha y la hora del salon.
                </p>
              </div>
            </fieldset>

            <ListaDeErrores errores={h.errores.length > 0 ? h.errores : h.horario.errores()} />

            {/* Fija abajo: con tantos campos, Guardar siempre queda a mano. */}
            <div className="acciones-panel acciones-panel--fija">
              <button
                type="button"
                className="boton-principal"
                onClick={() => void h.guardar()}
                disabled={h.guardando || !h.hayCambiosSinGuardar || !h.horario.estaCompleto()}
              >
                {h.guardando ? 'Guardando...' : 'Guardar horario'}
              </button>
              <button type="button" onClick={h.descartarCambios} disabled={h.guardando || !h.hayCambiosSinGuardar}>
                Descartar cambios
              </button>
            </div>
          </>
        )}
      </EstadoDeConsulta>
    </section>
  )
}
