// Formulario de inicio de sesion. Solo estructura y accesibilidad: el diseno
// visual se agrega despues. No tiene logica propia: todo llega por props
// desde useSesion.

import type { FormEvent } from 'react'
import type { CredencialesDTO } from '../../compartido/tipos/api.ts'
import type { Credenciales } from '../features/sesion/Credenciales.ts'

interface Props {
  credenciales: Credenciales
  enviando: boolean
  errores: string[]
  aviso: string | null
  onCambiar: (cambios: Partial<CredencialesDTO>) => void
  onEnviar: () => void
}

export function FormularioDeLogin({ credenciales, enviando, errores, aviso, onCambiar, onEnviar }: Props) {
  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    onEnviar()
  }

  return (
    <form onSubmit={enviar} aria-labelledby="titulo-login" noValidate>
      <h1 id="titulo-login">Panel del salon</h1>

      {aviso && <p role="status">{aviso}</p>}

      <label htmlFor="login-usuario">Usuario</label>
      <input
        id="login-usuario"
        name="usuario"
        autoComplete="username"
        value={credenciales.usuario}
        onChange={(evento) => onCambiar({ usuario: evento.target.value })}
        disabled={enviando}
        required
      />

      <label htmlFor="login-contrasena">Contrasena</label>
      <input
        id="login-contrasena"
        name="contrasena"
        type="password"
        autoComplete="current-password"
        value={credenciales.contrasena}
        onChange={(evento) => onCambiar({ contrasena: evento.target.value })}
        disabled={enviando}
        required
      />

      {errores.length > 0 && (
        <ul role="alert">
          {errores.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <button type="submit" disabled={enviando}>
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
