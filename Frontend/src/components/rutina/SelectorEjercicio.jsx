import { useEffect, useState } from 'react'
import Icono from '../iconos/Icono'
import { useEjercicios } from '../../context/ejerciciosContext'

// Ventana para buscar y elegir un ejercicio de la biblioteca
function SelectorEjercicio({ onElegir, onCerrar }) {
  const { ejercicios } = useEjercicios()
  const [busqueda, setBusqueda] = useState('')

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCerrar])

  // Búsqueda sin importar mayúsculas ni tildes
  const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const q = normalizar(busqueda)
  const resultados = ejercicios.filter(
    (e) => normalizar(e.nombre).includes(q) || e.musculos.some((m) => normalizar(m).includes(q))
  )

  return (
    <div className="modal" onClick={onCerrar}>
      <div
        className="modal__caja"
        role="dialog"
        aria-modal="true"
        aria-label="Agregar ejercicio"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2>Agregar ejercicio</h2>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tamano={20} />
          </button>
        </div>

        <div className="modal__buscar">
          <Icono nombre="buscar" tamano={18} />
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o músculo…"
          />
        </div>

        <ul className="modal__lista">
          {resultados.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => onElegir(e)}>
                <span>
                  <strong>{e.nombre}</strong>
                  <small>{e.musculos.join(' · ')}</small>
                </span>
                <Icono nombre="mas" tamano={18} />
              </button>
            </li>
          ))}
          {resultados.length === 0 && (
            <li className="modal__vacio texto-suave">No se encontraron ejercicios.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default SelectorEjercicio
