// Estado de la sesion de la duena para toda la vista del panel.
//
//   verificando -> al abrir, se confirma con el servidor el token guardado
//   sin-sesion  -> se muestra el login
//   con-sesion  -> se muestra el panel
//
// Si el servidor rechaza el token en cualquier momento (vencio, se cerro en
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
  // Mensaje para mostrar en el login (por ejemplo, "tu sesion vencio").
  aviso: string | null
  credenciales: Credenciales
  enviando: boolean
  errores: string[]
  cambiarCredenciales: (cambios: Partial<CredencialesDTO>) => void
  iniciar: () => Promise<void>
  cerrar: () => Promise<void>
}

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

  // Al abrir el panel: recuperar la sesion guardada si el servidor la acepta.
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

  // Aunque el servidor no responda, la duena sale del panel igual.
  async function cerrar(): Promise<void> {
    try {
      await cerrarSesion.ejecutar()
    } catch {
      // CerrarSesion ya borro la sesion local; no hay nada mas que hacer.
    } finally {
      salir(null)
    }
  }

  return { estado, sesion, aviso, credenciales, enviando, errores, cambiarCredenciales, iniciar, cerrar }
}
