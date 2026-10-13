import { useEffect, useState } from 'react'
import Icono from '../iconos/Icono'

/**
 * Ventana para elegir qué entrenar: primero la rutina, después el día.
 * Viene marcada la rutina sugerida y el día que toca.
 */
function ElegirEntreno({ rutinas, sugerencia, onElegir, onCerrar }) {
  const [rutinaId, setRutinaId] = useState(sugerencia?.rutina.id ?? rutinas[0]?.id)
  const rutina = rutinas.find((r) => r.id === rutinaId)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCerrar])

  return (
    <div className="modal" onClick={onCerrar}>
      <div
        className="modal__caja elegir"
        role="dialog"
        aria-modal="true"
        aria-label="Comenzar entreno"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2>Comenzar entreno</h2>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tamano={20} />
          </button>
        </div>

        <p className="elegir__paso">1. Elegí la rutina</p>
        <div className="elegir__rutinas">
          {rutinas.map((r) => (
            <button
              key={r.id}
              type="button"
              className={'filtro' + (r.id === rutinaId ? ' filtro--activo' : '')}
              onClick={() => setRutinaId(r.id)}
            >
              {r.nombre}
            </button>
          ))}
        </div>

        <p className="elegir__paso">2. Elegí el día</p>
        <ul className="modal__lista">
          {rutina?.dias.map((dia, i) => {
            const vacio = dia.ejercicios.length === 0
            const tocaHoy = sugerencia && sugerencia.rutina.id === rutina.id && sugerencia.diaIndice === i
            return (
              <li key={i}>
                <button type="button" disabled={vacio} onClick={() => onElegir(rutina, i)}>
                  <span>
                    <strong>
                      Día {i + 1} · {dia.nombre || 'Sin nombre'}
                    </strong>
                    <small>{vacio ? 'Sin ejercicios' : `${dia.ejercicios.length} ejercicios`}</small>
                  </span>
                  {tocaHoy && <span className="chip chip--hoy">Te toca</span>}
                  <Icono nombre="play" tamano={18} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default ElegirEntreno
