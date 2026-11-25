// Formulario de inicio de sesion: una tarjeta centrada en la pantalla. Los
// estilos estan en VistaDuena.css. No tiene logica propia: todo llega por
// props desde useSesion.

import type { FormEvent } from 'react'
import { ListaDeErrores } from '../../compartido/componentes/ListaDeErrores.tsx'
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
    <main className="login">
      <form className="login__tarjeta" onSubmit={enviar} aria-labelledby="titulo-login" noValidate>
        <h1 id="titulo-login" className="login__titulo">
          Panel del salon
        </h1>
        <p className="login__introduccion">Entra para ver tu agenda y administrar tu salon.</p>

        {aviso && (
          <p className="login__aviso" role="status">
            {aviso}
          </p>
        )}

        <label htmlFor="login-usuario" className="login__etiqueta">
          Usuario
        </label>
        <input
          className="login__campo"
          id="login-usuario"
          name="usuario"
          autoComplete="username"
          value={credenciales.usuario}
          onChange={(evento) => onCambiar({ usuario: evento.target.value })}
          disabled={enviando}
          required
        />

        <label htmlFor="login-contrasena" className="login__etiqueta">
          Contrasena
        </label>
        <input
          className="login__campo"
          id="login-contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          value={credenciales.contrasena}
          onChange={(evento) => onCambiar({ contrasena: evento.target.value })}
          disabled={enviando}
          required
        />

        <ListaDeErrores errores={errores} />

        <button type="submit" className="login__entrar" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
