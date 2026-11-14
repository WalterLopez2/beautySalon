// JSON base de una cita (el `CitaDTO` del frontend), SIN datos de la clienta.
// La vista publica lo usa tal cual; el panel le agrega la clienta.

import type { CitaRegistrada } from './repositorioCitas';

export function aCitaDTO(cita: CitaRegistrada) {
  return {
    id: cita.id,
    servicioId: cita.servicioId,
    servicioNombre: cita.servicioNombre,
    fecha: cita.fecha,
    inicio: cita.inicio,
    duracionMin: cita.duracionMin,
    estado: cita.estado,
    precio: cita.precio,
  };
}
