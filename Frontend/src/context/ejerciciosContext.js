import { createContext, useContext } from 'react'

export const EjerciciosContext = createContext(null)

// Hook para usar la biblioteca de ejercicios desde cualquier componente:
// const { ejercicios, guardarEjercicio, eliminarEjercicio, buscarEjercicio } = useEjercicios()
export function useEjercicios() {
  const ctx = useContext(EjerciciosContext)
  if (!ctx) throw new Error('useEjercicios debe usarse dentro de <EjerciciosProvider>')
  return ctx
}
