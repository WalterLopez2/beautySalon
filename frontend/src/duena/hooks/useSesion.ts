// Estado de la sesion de la duena para toda la vista del panel.
//
//   verificando -> al abrir, se le pregunta al servidor si la cookie sirve
//   sin-sesion  -> se muestra el login
//   con-sesion  -> se muestra el panel
//
// Si el servidor rechaza la sesion en cualquier momento (vencio, se cerro en
// otro dispositivo, cambio la contrasena), vuelve solo a "sin-sesion".

import { useEffect, useState } from 'react'
import type { CredencialesDTO } from '../../compartido/tipos/api.ts'
import { erroresDeError, mensajeDeError } from '../../compartido/utils/errores.ts'
import { contenedorDuena, type ContenedorDuena } from '../contenedor.ts'
import { Credenciales } from '../features/sesion/Credenciales.ts'
import type { Sesion } from '../features/sesion/Sesion.ts'

export type EstadoDeSesion = 'verificando' | 'sin-sesion' | 'con-sesion'

type DependenciasDeSesion = Pick<
  ContenedorDuena,
  'iniciarSesion' | 'recuperarSesion' | 'cerrarSesion' | 'avisosDeSesion'
>

interface SesionEnPantalla {
  estado: EstadoDeSesion
  sesion: Sesion | null
  // Mensaje para el login ("tu sesion vencio") o el panel ("no se pudo salir").
  aviso: string | null
  credenciales: Credenciales
  enviando: boolean
  errores: string[]
  cambiarCredenciales: (cambios: Partial<CredencialesDTO>) => void
  iniciar: () => Promise<void>
  cerrar: () => Promise<void>
}

const NO_SE_PUDO_SALIR =
  'No se pudo cerrar la sesion: sigue abierta en este navegador. Revisa tu internet e intenta de nuevo.'
const SESION_PERDIDA = 'Tu sesion vencio o se cerro. Inicia sesion de nuevo.'

export function useSesion(dependencias: DependenciasDeSesion = contenedorDuena): SesionEnPantalla {
  const { iniciarSesion, recuperarSesion, cerrarSesion, avisosDeSesion } = dependencias
  const [estado, setEstado] = useState<EstadoDeSesion>('verificando')
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [credenciales, setCredenciales] = useState(Credenciales.vacias())
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  function entrar(nueva: Sesion): void {
    setSesion(nueva)
    setEstado('con-sesion')
    setAviso(null)
  }

  function salir(mensaje: string | null): void {
    setSesion(null)
    setEstado('sin-sesion')
    setAviso(mensaje)
  }

  // Al abrir el panel: recuperar la sesion si el servidor la acepta.
  useEffect(() => {
    let vigente = true
    recuperarSesion
      .ejecutar()
      .then((recuperada) => {
        if (!vigente) return
        if (recuperada) entrar(recuperada)
        else salir(null)
      })
      .catch((causa: unknown) => {
        if (vigente) salir(mensajeDeError(causa))
      })
    return () => {
      vigente = false
    }
  }, [recuperarSesion])

  // Si cualquier pedido del panel recibe 401, se vuelve al login.
  useEffect(() => avisosDeSesion.alPerderse(() => salir(SESION_PERDIDA)), [avisosDeSesion])

  function cambiarCredenciales(cambios: Partial<CredencialesDTO>): void {
    setCredenciales(credenciales.con(cambios))
    setErrores([])
  }

  async function iniciar(): Promise<void> {
    setEnviando(true)
    setErrores([])
    try {
      entrar(await iniciarSesion.ejecutar(credenciales))
      setCredenciales(Credenciales.vacias()) // la contrasena no se queda en memoria
    } catch (causa) {
      setErrores(erroresDeError(causa))
    } finally {
      setEnviando(false)
    }
  }

  // Solo se sale si el servidor borro la cookie; si no, se avisa.
  async function cerrar(): Promise<void> {
    setAviso(null)
    try {
      await cerrarSesion.ejecutar()
      salir(null)
    } catch {
      setAviso(NO_SE_PUDO_SALIR)
    }
  }

  return { estado, sesion, aviso, credenciales, enviando, errores, cambiarCredenciales, iniciar, cerrar }
}
