import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import Cargando from './Cargando'

// Muestra el contenido solo si hay sesión iniciada; si no, manda a /login
function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return <Cargando texto="Iniciando…" />
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname + location.search }} />
  return children
}

export default RutaProtegida
