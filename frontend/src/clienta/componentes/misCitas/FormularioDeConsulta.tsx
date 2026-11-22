// Telefono y codigo para ver las citas. Solo captura: las reglas viven en
// `ConsultaDeHistorial`. Los campos no llevan `name` para que nunca puedan
// terminar en la URL, y quedan de solo lectura mientras responde el servidor
// para que el resultado corresponda a lo que esta escrito.

import type { FormEvent } from 'react'
import { ListaDeErrores } from '../../../compartido/componentes/ListaDeErrores.tsx'
import type { ConsultaDeHistorialDTO } from '../../../compartido/tipos/api.ts'
import type { ConsultaDeHistorial } from '../../features/historial/ConsultaDeHistorial.ts'

interface Props {
  consulta: ConsultaDeHistorial
  consultando: boolean
  errores: readonly string[]
  alCambiar: (cambios: Partial<ConsultaDeHistorialDTO>) => void
  alConsultar: () => void
}

export function FormularioDeConsulta({ consulta, consultando, errores, alCambiar, alConsultar }: Props) {
  function alEnviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    if (!consultando) alConsultar()
  }

  return (
    <form className="formulario-consulta" noValidate onSubmit={alEnviar}>
      <label className="campo">
        <span className="campo__etiqueta">Telefono con el que agendaste</span>
        <input
          type="tel"
          inputMode="tel"
          className="campo__control"
          autoComplete="tel"
          readOnly={consultando}
          value={consulta.telefono}
          onChange={(evento) => alCambiar({ telefono: evento.target.value })}
        />
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Codigo de consulta</span>
        <input
          className="campo__control campo__control--codigo"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          readOnly={consultando}
          value={consulta.codigo}
          onChange={(evento) => alCambiar({ codigo: evento.target.value })}
        />
      </label>

      <ListaDeErrores errores={errores} />

      <button type="submit" className="boton" disabled={consultando}>
        {consultando ? 'Buscando...' : 'Ver mis citas'}
      </button>
    </form>
  )
}
