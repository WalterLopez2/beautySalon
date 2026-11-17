// Editor del horario de atencion y las reglas de reserva. Los cambios se
// guardan todos juntos con "Guardar horario".

import { DIAS_DE_LA_SEMANA } from '../../features/horario/HorarioSemanal.ts'
import { useHorarioDelSalon } from '../../hooks/useHorarioDelSalon.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'
import { ListaDeErrores } from '../ListaDeErrores.tsx'
import { FilaDeDia } from './FilaDeDia.tsx'

// Un input numerico vacio significa "sin valor todavia".
function aNumeroONull(texto: string): number | null {
  return texto.trim() === '' ? null : Number(texto)
}

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

              <label htmlFor="horario-intervalo">Turnos cada (minutos)</label>
              <input
                id="horario-intervalo"
                type="number"
                value={h.horario.intervaloMin ?? ''}
                onChange={(e) => h.cambiarIntervalo(aNumeroONull(e.target.value))}
              />

              <label htmlFor="horario-maximo">Maximo de citas por venir por clienta</label>
              <input
                id="horario-maximo"
                type="number"
                value={h.horario.maxCitasPendientes ?? ''}
                onChange={(e) => h.cambiarMaximoDeCitasPendientes(aNumeroONull(e.target.value))}
              />

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
