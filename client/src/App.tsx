// Elige la vista segun la direccion: /panel es de la duena; todo lo demas es
// la pagina publica de la clienta.
//
// Cada vista se carga por separado (lazy): quien visita la pagina publica no
// descarga el codigo del panel, y viceversa.

import { lazy, Suspense } from 'react'
import './App.css'

const VistaClienta = lazy(() => import('./clienta/VistaClienta.tsx'))
const VistaDuena = lazy(() => import('./duena/VistaDuena.tsx'))

const RUTA_DEL_PANEL = '/panel'

function esRutaDelPanel(ruta: string): boolean {
  return ruta === RUTA_DEL_PANEL || ruta.startsWith(`${RUTA_DEL_PANEL}/`)
}

function App() {
  const Vista = esRutaDelPanel(window.location.pathname) ? VistaDuena : VistaClienta

  return (
    <Suspense fallback={<p role="status">Cargando...</p>}>
      <Vista />
    </Suspense>
  )
}

export default App
