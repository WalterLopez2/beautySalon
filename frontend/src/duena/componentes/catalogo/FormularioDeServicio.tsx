// Formulario para crear o editar un servicio. Sin logica propia: los campos
// y su validacion viven en BorradorDeServicio.

import type { FormEvent } from 'react'
import type { BorradorDeServicio, CamposDelServicio } from '../../features/catalogo/BorradorDeServicio.ts'
import { ListaDeErrores } from '../../../compartido/componentes/ListaDeErrores.tsx'

interface Props {
  borrador: BorradorDeServicio
  esNuevo: boolean
  guardando: boolean
  errores: string[]
  onCambiar: (borrador: BorradorDeServicio) => void
  onEnviar: () => void
  onCancelar: () => void
}

export function FormularioDeServicio({ borrador, esNuevo, guardando, errores, onCambiar, onEnviar, onCancelar }: Props) {
  const { campos } = borrador

  function cambiar(cambios: Partial<CamposDelServicio>): void {
    onCambiar(borrador.con(cambios))
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    onEnviar()
  }

  return (
    <form onSubmit={enviar} aria-labelledby="titulo-form-servicio" noValidate>
      <h3 id="titulo-form-servicio">{esNuevo ? 'Nuevo servicio' : 'Editar servicio'}</h3>

      <label htmlFor="servicio-nombre">Nombre</label>
      <input id="servicio-nombre" value={campos.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} required />

      <label htmlFor="servicio-descripcion">Descripcion</label>
      <textarea
        id="servicio-descripcion"
        value={campos.descripcion}
        onChange={(e) => cambiar({ descripcion: e.target.value })}
      />

      <label htmlFor="servicio-precio">Precio (L)</label>
      <input
        id="servicio-precio"
        inputMode="decimal"
        value={campos.precio}
        onChange={(e) => cambiar({ precio: e.target.value })}
        required
      />

      <label htmlFor="servicio-duracion">Duracion (minutos)</label>
      <input
        id="servicio-duracion"
        inputMode="numeric"
        value={campos.duracionMin}
        onChange={(e) => cambiar({ duracionMin: e.target.value })}
        required
      />

      <label htmlFor="servicio-categoria">Categoria</label>
      <input id="servicio-categoria" value={campos.categoria} onChange={(e) => cambiar({ categoria: e.target.value })} />

      <ListaDeErrores errores={errores} />

      <button type="submit" disabled={guardando || !borrador.estaCompleto()}>
        {guardando ? 'Guardando...' : 'Guardar'}
      </button>
      <button type="button" onClick={onCancelar} disabled={guardando}>
        Cancelar
      </button>
    </form>
  )
}
