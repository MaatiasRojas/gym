import { NavLink } from 'react-router-dom'
import Icono from '../iconos/Icono'
import { useAjustes } from '../../context/ajustesContext'
import './Sidebar.css'

const enlaces = [
  { ruta: '/', texto: 'Inicio', icono: 'inicio' },
  { ruta: '/rutina', texto: 'Mis rutinas', icono: 'rutinas' },
  { ruta: '/ejercicios', texto: 'Ejercicios', icono: 'ejercicios' },
  { ruta: '/progreso', texto: 'Progreso', icono: 'progreso' },
  // Solo se ve en la barra de abajo del celular (ahí no aparece el bloque de usuario)
  { ruta: '/ajustes', texto: 'Ajustes', icono: 'perfil', soloCelular: true },
]

function Sidebar() {
  const { ajustes } = useAjustes()
  const iniciales = ((ajustes.nombre[0] ?? '') + (ajustes.apellido[0] ?? '')).toUpperCase() || '?'

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-icono">
          <Icono nombre="pesa" tamano={22} />
        </span>
        <span className="sidebar__logo-texto">GymTrack</span>
      </div>

      <nav className="sidebar__nav">
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            end={enlace.ruta === '/'}
            className={({ isActive }) =>
              'sidebar__link' +
              (isActive ? ' sidebar__link--activo' : '') +
              (enlace.soloCelular ? ' sidebar__link--celular' : '')
            }
          >
            <Icono nombre={enlace.icono} />
            <span>{enlace.texto}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/ajustes"
        className={({ isActive }) => 'sidebar__usuario' + (isActive ? ' sidebar__usuario--activo' : '')}
        title="Ajustes"
      >
        <span className="sidebar__avatar">{iniciales}</span>
        <div className="sidebar__usuario-datos">
          <strong>
            {ajustes.nombre} {ajustes.apellido}
          </strong>
          <span className="sidebar__ajustes">Ajustes</span>
        </div>
      </NavLink>
    </aside>
  )
}

export default Sidebar
