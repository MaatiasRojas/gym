import { createContext, useContext } from 'react'

// Valores por defecto mientras no llegan los del backend
export const AJUSTES_INICIALES = {
  nombre: '',
  apellido: '',
  objetivoTitulo: '',
  objetivoDescripcion: '',
  metaSemanal: 4,
  sonido: true, // pitido al terminar el descanso
  vibracion: true, // vibración al terminar el descanso (solo Android)
  pantallaEncendida: true, // no apagar la pantalla durante el entreno
}

export const AjustesContext = createContext(null)

// const { ajustes, cambiarAjuste } = useAjustes()
export function useAjustes() {
  const ctx = useContext(AjustesContext)
  if (!ctx) throw new Error('useAjustes debe usarse dentro de <AjustesProvider>')
  return ctx
}
