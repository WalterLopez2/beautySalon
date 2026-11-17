// Formulario para bloquear uno o varios dias, completos o solo unas horas.

import type { FormEvent } from 'react'
import type { BorradorDeBloqueo, CamposDelBloqueo } from '../../features/bloqueos/BorradorDeBloqueo.ts'
import { ListaDeErrores } from '../ListaDeErrores.tsx'

interface Props {
  borrador: BorradorDeBloqueo
  guardando: boolean
  errores: string[]
  onCambiar: (borrador: BorradorDeBloqueo) => void
  onEnviar: () => void
  onCancelar: () => void
}

export function FormularioDeBloqueo({ borrador, guardando, errores, onCambiar, onEnviar, onCancelar }: Props) {
  const { campos } = borrador

  function cambiar(cambios: Partial<CamposDelBloqueo>): void {
    onCambiar(borrador.con(cambios))
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    onEnviar()
  }

  return (
    <form onSubmit={enviar} aria-labelledby="titulo-form-bloqueo" noValidate>
      <h3 id="titulo-form-bloqueo">Nuevo bloqueo</h3>

      <label htmlFor="bloqueo-desde">Desde</label>
      <input id="bloqueo-desde" type="date" value={campos.desde} onChange={(e) => cambiar({ desde: e.target.value })} />

      <label htmlFor="bloqueo-hasta">Hasta (opcional)</label>
      <input id="bloqueo-hasta" type="date" value={campos.hasta} onChange={(e) => cambiar({ hasta: e.target.value })} />

      <label>
        <input
          type="checkbox"
          checked={campos.todoElDia}
          onChange={(e) => cambiar({ todoElDia: e.target.checked })}
        />
        Todo el dia
      </label>

      {!campos.todoElDia && (
        <>
          <label htmlFor="bloqueo-inicio">De</label>
          <input id="bloqueo-inicio" type="time" value={campos.inicio} onChange={(e) => cambiar({ inicio: e.target.value })} />
          <label htmlFor="bloqueo-fin">A</label>
          <input id="bloqueo-fin" type="time" value={campos.fin} onChange={(e) => cambiar({ fin: e.target.value })} />
        </>
      )}

      <label htmlFor="bloqueo-motivo">Motivo (opcional)</label>
      <input id="bloqueo-motivo" value={campos.motivo} onChange={(e) => cambiar({ motivo: e.target.value })} />

      <ListaDeErrores errores={errores.length > 0 ? errores : borrador.errores()} />

      <button type="submit" disabled={guardando || !borrador.estaCompleto()}>
        {guardando ? 'Guardando...' : 'Bloquear'}
      </button>
      <button type="button" onClick={onCancelar} disabled={guardando}>
        Cancelar
      </button>
    </form>
  )
}
