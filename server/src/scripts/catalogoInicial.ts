// Servicios del salon tomados del prototipo (nombres, categorias y duracion).
//
// IMPORTANTE: el prototipo no trae precios. Los precios de abajo son
// provisionales (0) y hay que reemplazarlos por los reales antes de abrir la
// pagina al publico. Correr de nuevo `db:preparar` actualiza los existentes.

import type { DatosServicio } from '../compartido/servicios/repositorioServicios';

const PRECIO_POR_DEFINIR = 0;
const HORA = 60;

interface ServicioDelCatalogo {
  nombre: string;
  horas: number;
  descripcion?: string;
}

const CATEGORIAS: Record<string, ServicioDelCatalogo[]> = {
  'Uñas': [
    { nombre: 'Acrílico', horas: 2 },
    { nombre: 'Techgel', horas: 2 },
    { nombre: 'Esmaltado semipermanente', horas: 1 },
    { nombre: 'Calcio', horas: 1 },
    { nombre: 'Manicura', horas: 1 },
  ],
  Pedicure: [
    { nombre: 'Pedicure spa', horas: 2 },
    { nombre: 'Pedicure normal', horas: 1 },
    { nombre: 'Esmaltado', horas: 1 },
  ],
  'Pestañas y cejas': [
    { nombre: 'Pestañas pelo a pelo', horas: 2 },
    { nombre: 'Lifting de pestañas', horas: 1 },
    { nombre: 'Laminado de cejas', horas: 1 },
  ],
  Maquillaje: [
    { nombre: 'Maquillaje social', horas: 1 },
    { nombre: 'Maquillaje de novia', horas: 3 },
  ],
  'Cabello express': [
    { nombre: 'Alisado', horas: 3 },
    { nombre: 'Tratamientos', horas: 1 },
    { nombre: 'Secados', horas: 1 },
    { nombre: 'Planchados', horas: 1 },
    { nombre: 'Ondas', horas: 1 },
    { nombre: 'Cortes', horas: 1 },
  ],
  Piel: [{ nombre: 'Limpieza facial', horas: 1, descripcion: 'Con especialista aliada' }],
};

export const CATALOGO_INICIAL: DatosServicio[] = Object.entries(CATEGORIAS).flatMap(
  ([categoria, servicios]) =>
    servicios.map((servicio) => ({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? null,
      precio: PRECIO_POR_DEFINIR,
      duracionMin: servicio.horas * HORA,
      categoria,
    })),
);
