// Forma del JSON que recibe el panel. A diferencia de la vista publica, aqui
// si van los datos de la clienta: la duena los necesita para contactarla.

import type { Cliente } from '../compartido/clientes/repositorioClientes';
import type { CitaRegistrada } from '../compartido/citas/repositorioCitas';
import { aCitaDTO } from '../compartido/citas/presentacion';

export function aClienta(clienta: Pick<Cliente, 'id' | 'nombre' | 'telefono' | 'correo'>) {
  return {
    id: clienta.id,
    nombre: clienta.nombre,
    telefono: clienta.telefono,
    correo: clienta.correo,
  };
}

export function aCitaDelPanel(cita: CitaRegistrada) {
  return { ...aCitaDTO(cita), clienta: aClienta(cita.clienta) };
}

export function aHistorialDeClienta(clienta: Cliente, citas: CitaRegistrada[]) {
  return { clienta: aClienta(clienta), citas: citas.map(aCitaDTO) };
}
