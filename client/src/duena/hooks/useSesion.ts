// Estado del inicio de sesion. Igual que `useAgendamiento` de la clienta, el
// hook no valida nada: guarda las Credenciales y delega en el caso de uso.

import { useState } from 'react'
import type { CredencialesDTO } from '../../compartido/tipos/api.ts'
import { erroresDeError } from '../../compartido/utils/errores.ts'
import { contenedorDuena } from '../contenedor.ts'
import type { AlmacenDeSesion } from '../features/sesion/almacenDeSesion.ts'
import { Credenciales } from '../features/sesion/Credenciales.ts'
import type { IniciarSesion } from '../features/sesion/IniciarSesion.ts'
import type { Sesion } from '../features/sesion/Sesion.ts'

interface SesionEnPantalla {
  sesion: Sesion | null
  credenciales: Credenciales
  enviando: boolean
  errores: string[]
  cambiarCredenciales: (cambios: Partial<CredencialesDTO>) => void
  iniciar: () => Promise<void>
  cerrar: () => void
}

export function useSesion(
  caso: IniciarSesion = contenedorDuena.iniciarSesion,
  almacen: AlmacenDeSesion = contenedorDuena.almacenDeSesion,
): SesionEnPantalla {
  // Si ya habia una sesion vigente guardada, la duena entra directo al panel.
  const [sesion, setSesion] = useState<Sesion | null>(() => almacen.leer())
  const [credenciales, setCredenciales] = useState(Credenciales.vacias())
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  function cambiarCredenciales(cambios: Partial<CredencialesDTO>): void {
    setCredenciales(credenciales.con(cambios))
    setErrores([])
  }

  async function iniciar(): Promise<void> {
    setEnviando(true)
    setErrores([])
    try {
      setSesion(await caso.ejecutar(credenciales))
      setCredenciales(Credenciales.vacias()) // la contrasena no se queda en memoria
    } catch (causa) {
      setErrores(erroresDeError(causa))
    } finally {
      setEnviando(false)
    }
  }

  function cerrar(): void {
    almacen.borrar()
    setSesion(null)
  }

  return { sesion, credenciales, enviando, errores, cambiarCredenciales, iniciar, cerrar }
}
