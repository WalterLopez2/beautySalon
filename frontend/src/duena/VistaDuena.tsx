// Punto de entrada de la vista de la duena (/panel). Decide que mostrar segun
// el estado de la sesion; nada del panel se muestra sin una sesion que el
// servidor haya aceptado.
//
// Ocultar el panel aqui es solo experiencia de usuario: la proteccion real
// esta en el backend, que rechaza cualquier pedido sin una sesion valida.

import { FormularioDeLogin } from './componentes/FormularioDeLogin.tsx'
import { PanelDeLaDuena } from './componentes/PanelDeLaDuena.tsx'
import { useSesion } from './hooks/useSesion.ts'
// Fuentes dentro del proyecto: la CSP no permite traerlas de otro sitio.
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import './VistaDuena.css'

export default function VistaDuena() {
  return (
    <div className="vista-duena">
      <PantallaSegunLaSesion />
    </div>
  )
}

function PantallaSegunLaSesion() {
  const sesion = useSesion()

  if (sesion.estado === 'verificando') {
    return (
      <p className="pantalla-del-panel" role="status">
        Verificando tu sesion...
      </p>
    )
  }

  if (sesion.estado === 'con-sesion' && sesion.sesion) {
    return (
      <PanelDeLaDuena
        sesion={sesion.sesion}
        aviso={sesion.aviso}
        onCerrarSesion={() => void sesion.cerrar()}
      />
    )
  }

  return (
    <FormularioDeLogin
      credenciales={sesion.credenciales}
      enviando={sesion.enviando}
      errores={sesion.errores}
      aviso={sesion.aviso}
      onCambiar={sesion.cambiarCredenciales}
      onEnviar={() => void sesion.iniciar()}
    />
  )
}
