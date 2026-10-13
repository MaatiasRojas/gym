import { useState } from 'react'
import Icono from '../iconos/Icono'
import { useEjercicios } from '../../context/ejerciciosContext'
import { MUSCULOS, colorMusculo } from '../../data/musculos'

// Búsqueda sin importar mayúsculas ni tildes
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const FILTRO_PROPIOS = 'Mis ejercicios'

function ListaEjercicios({ onAbrir }) {
  const { ejercicios } = useEjercicios()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState(null) // null = todos

  const q = normalizar(busqueda)
  const resultados = ejercicios
    .filter((e) => {
      if (filtro === FILTRO_PROPIOS) return e.personalizado
      if (filtro) return e.musculos.includes(filtro)
      return true
    })
    .filter((e) => normalizar(e.nombre).includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const filtros = [...MUSCULOS.map((m) => m.nombre), FILTRO_PROPIOS]

  return (
    <div className="ejercicios">
      <header className="pagina__header ejercicios__header">
        <div>
          <h1>Ejercicios</h1>
          <p className="texto-suave">{ejercicios.length} ejercicios en tu biblioteca.</p>
        </div>
        <button type="button" className="boton" onClick={() => onAbrir('nuevo')}>
          <Icono nombre="mas" tamano={18} /> Crear ejercicio
        </button>
      </header>

      <div className="buscador">
        <Icono nombre="buscar" tamano={18} />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar ejercicio…"
          aria-label="Buscar ejercicio"
        />
      </div>

      <div className="filtros" role="group" aria-label="Filtrar por músculo">
        <button
          type="button"
          className={'filtro' + (filtro === null ? ' filtro--activo' : '')}
          onClick={() => setFiltro(null)}
        >
          Todos
        </button>
        {filtros.map((f) => (
          <button
            key={f}
            type="button"
            className={'filtro' + (filtro === f ? ' filtro--activo' : '')}
            onClick={() => setFiltro(filtro === f ? null : f)}
          >
            {f}
          </button>
        ))}
      </div>

      {resultados.length === 0 ? (
        <div className="ejercicios__vacio">
          <p>No se encontraron ejercicios.</p>
          <button type="button" className="boton" onClick={() => onAbrir('nuevo')}>
            <Icono nombre="mas" tamano={18} /> Crear uno nuevo
          </button>
        </div>
      ) : (
        <ul className="ejercicios__lista">
          {resultados.map((e) => (
            <li key={e.id}>
              <button type="button" className="ejercicio-item" onClick={() => onAbrir(e.id)}>
                <Miniatura ejercicio={e} />
                <span className="ejercicio-item__info">
                  <span className="ejercicio-item__nombre">
                    {e.nombre}
                    {e.personalizado && <span className="badge">Propio</span>}
                  </span>
                  <span className="fila__tags">
                    {e.musculos.map((m) => (
                      <span key={m} className={`tag tag--${colorMusculo(m)}`}>
                        {m}
                      </span>
                    ))}
                  </span>
                </span>
                <Icono nombre="chevron" tamano={18} className="ejercicio-item__chevron" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Imagen del ejercicio, o la inicial con el color del músculo principal
function Miniatura({ ejercicio }) {
  if (ejercicio.imagen) {
    return <img className="miniatura" src={ejercicio.imagen} alt="" />
  }
  return (
    <span className={`miniatura tag--${colorMusculo(ejercicio.musculos[0])}`}>
      {ejercicio.nombre[0]}
    </span>
  )
}

export default ListaEjercicios
