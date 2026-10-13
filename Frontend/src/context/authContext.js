import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// const { usuario, cargando, iniciarSesion, registrarse, cerrarSesion } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
