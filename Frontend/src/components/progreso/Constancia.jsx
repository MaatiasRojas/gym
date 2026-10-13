import Icono from '../iconos/Icono'
import { semanasConstancia, habitos } from '../../utils/progreso'
import { indiceDia } from '../../utils/estadisticas'

const LETRAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const SEMANAS = 8
const DIA_MS = 24 * 60 * 60 * 1000

function nombreSemana(semana, k) {
  if (k === 0) return 'Esta semana'
  if (k === 1) return 'Semana pasada'
  const opciones = { day: 'numeric', month: 'short' }
  const desde = new Date(semana.inicio).toLocaleDateString('es-AR', opciones).replace('.', '')
  const hasta = new Date(semana.inicio + 6 * DIA_MS).toLocaleDateString('es-AR', opciones).replace('.', '')
  return `${desde} – ${hasta}`
}

/**
 * Constancia: una fila por semana con los días que entrenaste (como "Tu semana" del inicio)
 * y si cumpliste la meta semanal. Arriba, un resumen en palabras.
 */
function Constancia({ historial, meta, racha }) {
  const semanas = semanasConstancia(historial, meta, SEMANAS)
  const { porSemana, diasFuertes } = habitos(historial, SEMANAS)
  const estaSemana = semanas[0]
  const faltan = Math.max(0, meta - estaSemana.cantidad)
  const cumplidas = semanas.filter((s) => s.cumplida).length
  const hoy = indiceDia(Date.now())

  return (
    <div className="constancia">
      {/* ---------- Resumen en palabras ---------- */}
      <div className="constancia__resumen">
        <div className={'constancia__destacado' + (racha > 0 ? ' constancia__destacado--racha' : '')}>
          <span className="constancia__icono">
            <Icono nombre="fuego" tamano={22} />
          </span>
          <div>
            <strong>
              {racha > 0
                ? `${racha} ${racha === 1 ? 'semana seguida' : 'semanas seguidas'} cumpliendo tu meta`
                : 'Todavía no tenés racha'}
            </strong>
            <span>
              {estaSemana.cumplida
                ? `¡Esta semana ya cumpliste! Llevás ${estaSemana.cantidad} de ${meta}.`
                : `Esta semana llevás ${estaSemana.cantidad} de ${meta}: ${
                    faltan === 1 ? 'te falta 1 entreno' : `te faltan ${faltan} entrenos`
                  }.`}
            </span>
          </div>
        </div>

        <div className="constancia__datos">
          <div>
            <strong>
              {cumplidas} de {SEMANAS}
            </strong>
            <span>semanas con la meta cumplida</span>
          </div>
          <div>
            <strong>{porSemana.toLocaleString('es-AR')}</strong>
            <span>entrenos por semana en promedio</span>
          </div>
          <div>
            <strong>{diasFuertes.length ? diasFuertes.join(' · ') : '—'}</strong>
            <span>los días que más entrenás</span>
          </div>
        </div>
      </div>

      {/* ---------- Semana por semana ---------- */}
      <ul className="semanas" aria-label={`Tus últimas ${SEMANAS} semanas`}>
        {semanas.map((semana, k) => (
          <li key={semana.inicio} className={'semana-fila' + (semana.actual ? ' semana-fila--actual' : '')}>
            <span className="semana-fila__nombre">{nombreSemana(semana, k)}</span>

            <ol className="semana-fila__dias" aria-label={`${semana.cantidad} entrenamientos`}>
              {semana.dias.map((entreno, d) => {
                const futuro = semana.actual && d > hoy
                return (
                  <li
                    key={d}
                    className={
                      'dia-mini' +
                      (entreno ? ' dia-mini--hecho' : '') +
                      (futuro ? ' dia-mini--futuro' : '') +
                      (semana.actual && d === hoy ? ' dia-mini--hoy' : '')
                    }
                    title={entreno ? 'Entrenaste' : futuro ? '' : 'No entrenaste'}
                  >
                    {entreno ? <Icono nombre="check" tamano={12} /> : LETRAS[d]}
                  </li>
                )
              })}
            </ol>

            <span
              className={
                'semana-fila__estado' +
                (semana.cumplida ? ' semana-fila__estado--ok' : semana.actual ? ' semana-fila__estado--curso' : '')
              }
            >
              {semana.cumplida && <Icono nombre="check" tamano={14} />}
              {semana.cumplida
                ? `Meta cumplida (${semana.cantidad})`
                : `${semana.cantidad} de ${meta}`}
            </span>
          </li>
        ))}
      </ul>

      <p className="constancia__ayuda">
        <Icono nombre="check" tamano={12} /> = día que entrenaste. Cumplís la meta cuando llegás a {meta}{' '}
        {meta === 1 ? 'entreno' : 'entrenos'} en la semana.
      </p>
    </div>
  )
}

export default Constancia
