// Lo que la pagina publica muestra del salon. Lo escribe la duena en "Mi
// salon": ningun nombre, eslogan ni telefono esta en el codigo.

import { DatosInvalidos } from '../errores';
import { esTelefonoValido, normalizarTelefono, TELEFONO_INVALIDO } from './telefono';

export interface InformacionDelSalon {
  nombre: string;
  marca: string | null; // nombre corto del encabezado
  eslogan: string | null;
  descripcion: string | null;
  telefono: string | null; // WhatsApp al que escriben las clientas
}

export function prepararInformacion(informacion: InformacionDelSalon): InformacionDelSalon {
  const { telefono } = informacion;
  if (telefono === null) return informacion;
  if (!esTelefonoValido(telefono)) {
    throw new DatosInvalidos([TELEFONO_INVALIDO]);
  }
  return { ...informacion, telefono: normalizarTelefono(telefono) };
}
