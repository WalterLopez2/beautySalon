// "Mi salon": todo lo que la pagina publica dice del negocio.

import type { FormEvent } from 'react'
import { ListaDeErrores } from '../../../compartido/componentes/ListaDeErrores.tsx'
import { CAMPOS_DEL_SALON } from '../../features/salon/BorradorDeSalon.ts'
import { useInformacionDelSalon } from '../../hooks/useInformacionDelSalon.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'

export function SeccionSalon() {
  const s = useInformacionDelSalon()

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    void s.guardar()
  }

  return (
    <section aria-labelledby="titulo-salon">
      <h2 id="titulo-salon">Mi salon</h2>
      <p>Esto es lo que ven las clientas en tu pagina.</p>

      <EstadoDeConsulta cargando={s.cargando} error={s.error} onReintentar={s.recargar}>
        <form onSubmit={enviar} noValidate>
          {CAMPOS_DEL_SALON.map(({ campo, etiqueta, ayuda, maximo }) => {
            const propiedades = {
              id: `salon-${campo}`,
              'aria-describedby': `salon-${campo}-ayuda`,
              maxLength: maximo,
              disabled: s.guardando,
              value: s.borrador?.campos[campo] ?? '',
            }
            return (
              <div key={campo}>
                <label htmlFor={propiedades.id}>{etiqueta}</label>
                {campo === 'descripcion' ? (
                  <textarea {...propiedades} onChange={(e) => s.cambiar({ [campo]: e.target.value })} />
                ) : (
                  <input {...propiedades} onChange={(e) => s.cambiar({ [campo]: e.target.value })} />
                )}
                <p id={`salon-${campo}-ayuda`}>{ayuda}</p>
              </div>
            )
          })}

          <ListaDeErrores errores={s.errores} />
          {s.seGuardo && <p role="status">Guardado. Las clientas lo veran al abrir la pagina.</p>}

          <button type="submit" disabled={s.guardando || !s.hayCambiosSinGuardar}>
            {s.guardando ? 'Guardando...' : 'Guardar mi salon'}
          </button>
        </form>
      </EstadoDeConsulta>
    </section>
  )
}
