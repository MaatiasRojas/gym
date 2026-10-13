import Icono from '../iconos/Icono'
import { useEjercicios } from '../../context/ejerciciosContext'
import { colorMusculo } from '../../data/musculos'

const OPCIONES_SERIES = [1, 2, 3, 4, 5, 6]
const OPCIONES_REPS = ['1 - 3', '4 - 6', '6 - 8', '8 - 10', '10 - 12', '12 - 15', '15 - 20', '20+']
const OPCIONES_DESCANSO = [15, 30, 45, 60, 75, 90, 120, 150, 180, 240]

// Si el valor guardado no está en la lista (por ejemplo "6 - 12" o "45 seg"), se agrega como opción
// para que el select lo muestre bien en vez de saltar a la primera opción
const conValorActual = (opciones, valor) => (opciones.includes(valor) ? opciones : [valor, ...opciones])

function FilaEjercicio({ numero, item, esPrimero, esUltimo, onCambiar, onQuitar, onMover }) {
  const { buscarEjercicio } = useEjercicios()
  const ejercicio = buscarEjercicio(item.ejercicioId)

  return (
    <li className="fila">
      <span className="fila__numero">{numero}</span>

      <div className="fila__info">
        <p className="fila__nombre">{ejercicio?.nombre ?? 'Ejercicio eliminado'}</p>
        <div className="fila__tags">
          {ejercicio?.musculos.map((m) => (
            <span key={m} className={`tag tag--${colorMusculo(m)}`}>
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="fila__campos">
        <label className="fila__campo">
          <span>Series</span>
          <select value={item.series} onChange={(e) => onCambiar('series', Number(e.target.value))}>
            {conValorActual(OPCIONES_SERIES, item.series).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="fila__campo">
          <span>Repeticiones</span>
          <select value={item.reps} onChange={(e) => onCambiar('reps', e.target.value)}>
            {conValorActual(OPCIONES_REPS, item.reps).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>

        <div className="fila__campo fila__campo--descanso">
          <label htmlFor={`descanso-${item.uid}`}>Descanso</label>
          <div className="fila__descanso">
            <select
              id={`descanso-${item.uid}`}
              value={item.descanso}
              onChange={(e) => onCambiar('descanso', Number(e.target.value))}
            >
              {conValorActual(OPCIONES_DESCANSO, item.descanso).map((s) => (
                <option key={s} value={s}>
                  {s < 60 || s % 60 !== 0 ? `${s} seg` : `${s / 60} min`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="fila__acciones">
        <div className="fila__mover">
          <button type="button" onClick={() => onMover(-1)} disabled={esPrimero} aria-label="Subir">
            <Icono nombre="subir" tamano={16} />
          </button>
          <button type="button" onClick={() => onMover(1)} disabled={esUltimo} aria-label="Bajar">
            <Icono nombre="bajar" tamano={16} />
          </button>
        </div>
        <button type="button" className="fila__quitar" onClick={onQuitar} aria-label="Quitar ejercicio">
          <Icono nombre="basura" tamano={18} />
        </button>
      </div>
    </li>
  )
}

export default FilaEjercicio
