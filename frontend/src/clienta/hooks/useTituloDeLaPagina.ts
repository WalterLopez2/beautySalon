// El titulo de la pestana y su descripcion tambien los escribe la duena.

import { useEffect } from 'react'
import type { Salon } from '../features/salon/Salon.ts'

export function useTituloDeLaPagina(salon: Salon | null): void {
  useEffect(() => {
    if (!salon) return
    const titulo = salon.tituloDeLaPagina()
    if (titulo) document.title = titulo
    if (salon.descripcion) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', salon.descripcion)
    }
  }, [salon])
}
