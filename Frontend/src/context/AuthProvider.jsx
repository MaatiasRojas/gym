import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import { api, guardarToken, hayToken, SESION_VENCIDA } from '../api/cliente'

/**
 * Sesión del usuario.
 * - Al abrir la app, si hay un token guardado, pregunta al backend quién es el usuario.
 * - iniciarSesion / registrarse guardan el token que devuelve el backend.
 * - Si el backend responde 401 (sesión vencida), se cierra la sesión sola.
 */
function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(hayToken())

  useEffect(() => {
    if (!hayToken()) return
    api('/auth/yo')
      .then((d) => setUsuario(d.usuario))
      .catch(() => setUsuario(null)) // token vencido o servidor apagado: se pide login
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    const alVencer = () => setUsuario(null)
    window.addEventListener(SESION_VENCIDA, alVencer)
    return () => window.removeEventListener(SESION_VENCIDA, alVencer)
  }, [])

  async function iniciarSesion(email, password) {
    const d = await api('/auth/login', { metodo: 'POST', cuerpo: { email, password } })
    guardarToken(d.token)
    setUsuario(d.usuario)
  }

  async function registrarse(nombre, email, password) {
    const d = await api('/auth/registro', { metodo: 'POST', cuerpo: { nombre, email, password } })
    guardarToken(d.token)
    setUsuario(d.usuario)
  }

  function cerrarSesion() {
    guardarToken(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, registrarse, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
