import { createContext, useContext } from 'react'

export const RutinasContext = createContext(null)

// const { rutinas, guardarRutina, eliminarRutina, buscarRutina } = useRutinas()
export function useRutinas() {
  const ctx = useContext(RutinasContext)
  if (!ctx) throw new Error('useRutinas debe usarse dentro de <RutinasProvider>')
  return ctx
}
