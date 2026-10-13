import { createContext, useContext } from 'react'

export const EntrenamientosContext = createContext(null)

// const { historial, sesionActiva, iniciarSesion, ... } = useEntrenamientos()
export function useEntrenamientos() {
  const ctx = useContext(EntrenamientosContext)
  if (!ctx) throw new Error('useEntrenamientos debe usarse dentro de <EntrenamientosProvider>')
  return ctx
}
