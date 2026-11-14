// Estado del formulario de cita. El hook no valida nada por su cuenta: solo
// guarda la SolicitudDeCita y delega las reglas al dominio y al caso de uso.

import { useState } from 'react'
import type { AgendarCita } from '../features/agendamiento/AgendarCita.ts'
import type { CitaAgendada } from '../features/agendamiento/repositorioCitas.ts'
import { SolicitudDeCita } from '../features/agendamiento/SolicitudDeCita.ts'
import type { ContactoDTO } from '../../compartido/tipos/api.ts'
import type { Servicio } from '../../compartido/dominio/Servicio.ts'
import { contenedor } from '../contenedor.ts'
import { erroresDeError } from '../../compartido/utils/errores.ts'

interface Agendamiento {
  solicitud: SolicitudDeCita
  // Incluye el codigo de consulta: la vista debe mostrarlo y pedir que lo guarde.
  citaConfirmada: CitaAgendada | null
  enviando: boolean
  errores: string[]
  elegirServicio: (servicio: Servicio) => void
  elegirFecha: (fecha: string) => void
  elegirHora: (hora: string) => void
  cambiarContacto: (cambios: Partial<ContactoDTO>) => void
  enviar: () => Promise<void>
  reiniciar: () => void
}

export function useAgendamiento(
  caso: AgendarCita = contenedor.agendarCita,
): Agendamiento {
  const [solicitud, setSolicitud] = useState(SolicitudDeCita.vacia())
  const [citaConfirmada, setCitaConfirmada] = useState<CitaAgendada | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  // Al tocar el formulario se borran los errores: no se regana a la clienta
  // mientras esta corrigiendo.
  function actualizar(siguiente: SolicitudDeCita): void {
    setSolicitud(siguiente)
    setErrores([])
  }

  async function enviar(): Promise<void> {
    setEnviando(true)
    setErrores([])
    try {
      setCitaConfirmada(await caso.ejecutar(solicitud))
    } catch (causa) {
      setErrores(erroresDeError(causa))
    } finally {
      setEnviando(false)
    }
  }

  function reiniciar(): void {
    setSolicitud(SolicitudDeCita.vacia())
    setCitaConfirmada(null)
    setErrores([])
  }

  return {
    solicitud,
    citaConfirmada,
    enviando,
    errores,
    elegirServicio: (servicio) => actualizar(solicitud.conServicio(servicio)),
    elegirFecha: (fecha) => actualizar(solicitud.conFecha(fecha)),
    elegirHora: (hora) => actualizar(solicitud.conHora(hora)),
    cambiarContacto: (cambios) => actualizar(solicitud.conContacto(solicitud.contacto.con(cambios))),
    enviar,
    reiniciar,
  }
}
