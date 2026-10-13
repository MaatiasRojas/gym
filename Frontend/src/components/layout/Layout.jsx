import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

// Estructura común a las páginas internas: barra lateral + contenido.
// <Outlet /> muestra la página de la ruta actual (Principal, Rutina, etc.)
function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout__contenido">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
