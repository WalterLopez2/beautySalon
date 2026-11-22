// Datos con los que la clienta se identifica: nombre, telefono y correo
// (opcional). Las reglas viven en `DatosDeContacto`; aqui solo se capturan.
// `autoComplete` deja que el celular los llene solo.

import type { ContactoDTO } from '../../../compartido/tipos/api.ts'
import type { DatosDeContacto } from '../../features/agendamiento/DatosDeContacto.ts'

interface Props {
  contacto: DatosDeContacto
  alCambiar: (cambios: Partial<ContactoDTO>) => void
}

export function CamposDeContacto({ contacto, alCambiar }: Props) {
  return (
    <div className="campos-contacto">
      <label className="campo">
        <span className="campo__etiqueta">Nombre</span>
        <input
          className="campo__control"
          autoComplete="name"
          maxLength={120}
          value={contacto.nombre}
          onChange={(evento) => alCambiar({ nombre: evento.target.value })}
        />
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Telefono</span>
        <input
          type="tel"
          inputMode="tel"
          className="campo__control"
          autoComplete="tel"
          maxLength={30}
          value={contacto.telefono}
          onChange={(evento) => alCambiar({ telefono: evento.target.value })}
        />
        <span className="campo__ayuda">8 digitos de Honduras. Lo usaras con tu codigo para ver tu cita.</span>
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Correo (opcional)</span>
        <input
          type="email"
          className="campo__control"
          autoComplete="email"
          maxLength={254}
          value={contacto.correo}
          onChange={(evento) => alCambiar({ correo: evento.target.value })}
        />
      </label>
    </div>
  )
}
