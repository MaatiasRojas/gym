import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icono from '../iconos/Icono'
import GraficoEvolucion from './GraficoEvolucion'
import Constancia from './Constancia'
import { useEntrenamientos } from '../../context/entrenamientosContext'
import { useEjercicios } from '../../context/ejerciciosContext'
import { useRutinas } from '../../context/rutinasContext'
import { useAjustes } from '../../context/ajustesContext'
import { MUSCULOS, colorMusculo } from '../../data/musculos'
import { resumenSemanal } from '../../utils/estadisticas'
import { generarHistorialDemo } from '../../utils/datosDemo'
import {
  PERIODOS,
  filtrarPeriodo,
  analizarRecords,
  serieEjercicio,
  ejerciciosHechos,
  seriesPorMusculo,
  formatearDuracion,
  formatearKg,
  fechaCorta,
} from '../../utils/progreso'
import './Progreso.css'

const METRICAS = [
  { id: 'peso', texto: 'Peso máx.' },
  { id: 'rm', texto: '1RM est.' },
  { id: 'volumen', texto: 'Volumen' },
]

const DIA_MS = 24 * 60 * 60 * 1000

function Progreso() {
  const { historial, cargarDemo, borrarDemo } = useEntrenamientos()
  const { buscarEjercicio } = useEjercicios()
  const { rutinas } = useRutinas()
  const { ajustes } = useAjustes()

  const [periodoId, setPeriodoId] = useState('3m')
  const [metrica, setMetrica] = useState('peso')
  const [ejercicioElegido, setEjercicioElegido] = useState(null)
  const [verTodosRecords, setVerTodosRecords] = useState(false)
  const [verTodoHistorial, setVerTodoHistorial] = useState(false)
  const [abierto, setAbierto] = useState(null) // id de la sesión expandida en el historial

  // ---------- Sin datos todavía ----------
  if (historial.length === 0) {
    return (
      <div className="progreso">
        <Encabezado />
        <div className="tarjeta progreso__vacio">
          <Icono nombre="progreso" tamano={36} />
          <h2>Todavía no hay entrenamientos</h2>
          <p className="texto-suave">
            Cuando termines tu primer entreno vas a ver acá tu evolución, récords y constancia.
          </p>
          <div className="progreso__vacio-botones">
            <Link to="/" className="boton">
              <Icono nombre="play" tamano={16} /> Comenzar entreno
            </Link>
            {rutinas.length > 0 && (
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => cargarDemo(generarHistorialDemo(rutinas[0], buscarEjercicio))}
              >
                Cargar datos de ejemplo
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---------- Cálculos ----------
  const periodo = PERIODOS.find((p) => p.id === periodoId)
  const { actual } = filtrarPeriodo(historial, periodo.dias)
  const { mejores, recordsPorSesion, records } = analizarRecords(historial)
  const hayDemo = historial.some((s) => s.demo)

  // Evolución del ejercicio elegido (por defecto, el último que hiciste)
  const hechos = ejerciciosHechos(historial)
  const ejercicioId = hechos.includes(ejercicioElegido) ? ejercicioElegido : hechos[0]
  const infoEjercicio = buscarEjercicio(ejercicioId)
  const puntos = serieEjercicio(actual, ejercicioId, metrica, recordsPorSesion)
  const ultimoValor = puntos[puntos.length - 1]?.valor
  const cambio = puntos.length > 1 ? Math.round((ultimoValor - puntos[0].valor) * 10) / 10 : null

  // Récords: mejor marca de cada ejercicio, los más recientes primero
  const listaRecords = Object.entries(mejores)
    .map(([id, r]) => ({ ejercicioId: Number(id), ...r }))
    .sort((a, b) => b.fecha - a.fecha)
  const esNuevo = (r) =>
    Date.now() - r.fecha < 14 * DIA_MS &&
    records.some((x) => x.ejercicioId === r.ejercicioId && x.fecha === r.fecha)

  // Series por músculo en el período
  const conteoMusculos = seriesPorMusculo(actual, buscarEjercicio)
  const musculos = MUSCULOS.map((m) => ({ ...m, series: conteoMusculos[m.nombre] ?? 0 })).sort(
    (a, b) => b.series - a.series
  )
  const maxSeries = musculos[0]?.series || 1
  const rezagado = [...musculos].reverse().find((m) => m.series < maxSeries * 0.4 && maxSeries > 0)

  const racha = resumenSemanal(historial, ajustes.metaSemanal).racha
  const sesionesHistorial = [...actual].reverse().slice(0, verTodoHistorial ? undefined : 5)

  return (
    <div className="progreso">
      <Encabezado>
        <div className="segmentado" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === periodoId}
              className={p.id === periodoId ? 'activo' : ''}
              onClick={() => setPeriodoId(p.id)}
            >
              {p.texto}
            </button>
          ))}
        </div>
      </Encabezado>

      {hayDemo && (
        <div className="aviso-demo">
          Estás viendo datos de ejemplo.
          <button type="button" onClick={borrarDemo}>
            Borrarlos
          </button>
        </div>
      )}

      <div className="progreso__grilla">
        {/* ---------- Evolución por ejercicio ---------- */}
        <section className="tarjeta evolucion">
          <div className="tarjeta__titulo">
            <Icono nombre="progreso" />
            <h3>Evolución por ejercicio</h3>
            <div className="evolucion__metricas" role="group" aria-label="Métrica">
              {METRICAS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={m.id === metrica}
                  className={'chip' + (m.id === metrica ? ' chip--hoy' : '')}
                  onClick={() => setMetrica(m.id)}
                >
                  {m.texto}
                </button>
              ))}
            </div>
          </div>

          <div className="evolucion__cabecera">
            <div>
              <select
                className="evolucion__select"
                value={ejercicioId}
                onChange={(e) => setEjercicioElegido(Number(e.target.value))}
                aria-label="Ejercicio"
              >
                {hechos.map((id) => (
                  <option key={id} value={id}>
                    {buscarEjercicio(id)?.nombre ?? 'Ejercicio eliminado'}
                  </option>
                ))}
              </select>
              {ultimoValor !== undefined && (
                <div className="evolucion__valor">
                  <strong>{metrica === 'volumen' ? formatearKg(ultimoValor) : `${ultimoValor.toLocaleString('es-AR')} kg`}</strong>
                  {cambio !== null && (
                    <span className={cambio >= 0 ? 'positivo' : 'neutro'}>
                      {cambio >= 0 ? '+' : '−'}
                      {Math.abs(cambio).toLocaleString('es-AR')} kg{periodo.dias ? ` en ${periodo.texto}` : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="fila__tags">
              {infoEjercicio?.musculos.map((m) => (
                <span key={m} className={`tag tag--${colorMusculo(m)}`}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          <GraficoEvolucion puntos={puntos} metrica={metrica} />

          <div className="evolucion__leyenda">
            <span>
              <i className="punto-record" /> Récord personal
            </span>
            <span>Cada punto es un entrenamiento</span>
          </div>
        </section>

        {/* ---------- Récords ---------- */}
        <section className="tarjeta">
          <div className="tarjeta__titulo">
            <Icono nombre="trofeo" />
            <h3>Récords personales</h3>
            {listaRecords.length > 5 && (
              <button type="button" className="tarjeta__link boton-texto" onClick={() => setVerTodosRecords((v) => !v)}>
                {verTodosRecords ? 'Ver menos' : 'Ver todos'}
              </button>
            )}
          </div>
          <ul className="records">
            {listaRecords.slice(0, verTodosRecords ? undefined : 5).map((r) => (
              <li key={r.ejercicioId}>
                <span className="records__icono">
                  <Icono nombre="trofeo" tamano={18} />
                </span>
                <div className="records__nombre">
                  <strong>{buscarEjercicio(r.ejercicioId)?.nombre ?? 'Ejercicio eliminado'}</strong>
                  <small>{fechaCorta(r.fecha)}</small>
                </div>
                <div className="records__valor">
                  <strong>
                    {r.peso.toLocaleString('es-AR')} × {r.reps}
                  </strong>
                  {esNuevo(r) && <small>NUEVO</small>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Constancia ---------- */}
        <section className="tarjeta constancia-tarjeta">
          <div className="tarjeta__titulo">
            <Icono nombre="rutinas" />
            <h3>Constancia</h3>
            <Link to="/ajustes" className="tarjeta__link">
              Meta: {ajustes.metaSemanal} por semana
            </Link>
          </div>
          <Constancia historial={historial} meta={ajustes.metaSemanal} racha={racha} />
        </section>

        {/* ---------- Historial ---------- */}
        <section className="tarjeta historial">
          <div className="tarjeta__titulo">
            <Icono nombre="reloj" />
            <h3>Historial de entrenamientos</h3>
            {actual.length > 5 && (
              <button type="button" className="tarjeta__link boton-texto" onClick={() => setVerTodoHistorial((v) => !v)}>
                {verTodoHistorial ? 'Ver menos' : `Ver todo (${actual.length})`}
              </button>
            )}
          </div>

          {sesionesHistorial.length === 0 ? (
            <p className="texto-suave">No hay entrenamientos en este período.</p>
          ) : (
            <ul className="historial__lista">
              {sesionesHistorial.map((s) => {
                const cantRecords = recordsPorSesion[s.id]?.length ?? 0
                const expandido = abierto === s.id
                const fecha = new Date(s.inicio)
                return (
                  <li key={s.id} className={expandido ? 'expandido' : ''}>
                    <button type="button" className="historial__fila" aria-expanded={expandido} onClick={() => setAbierto(expandido ? null : s.id)}>
                      <span className="historial__fecha">
                        <strong>{fecha.getDate()}</strong>
                        <small>{fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</small>
                      </span>
                      <span className="historial__info">
                        <strong>{s.diaNombre}</strong>
                        <small>
                          {s.rutinaNombre}
                          {cantRecords > 0 && (
                            <span className="historial__records">
                              {' '}
                              · {cantRecords} {cantRecords === 1 ? 'récord' : 'récords'}
                            </span>
                          )}
                        </small>
                      </span>
                      <span className="historial__dato">
                        {formatearDuracion(s.duracionSeg)}
                        <small>Duración</small>
                      </span>
                      <span className="historial__dato">
                        {formatearKg(s.volumen)}
                        <small>Volumen</small>
                      </span>
                      <Icono nombre="bajar" tamano={18} className="historial__flecha" />
                    </button>

                    {expandido && (
                      <ul className="historial__detalle">
                        {s.ejercicios.map((e) => (
                          <li key={e.ejercicioId}>
                            <strong>
                              {buscarEjercicio(e.ejercicioId)?.nombre ?? 'Ejercicio eliminado'}
                              {recordsPorSesion[s.id]?.includes(e.ejercicioId) && (
                                <Icono nombre="trofeo" tamano={14} className="historial__trofeo" />
                              )}
                            </strong>
                            <span>{e.series.map((x) => `${x.peso}×${x.reps}`).join(' · ')}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* ---------- Series por músculo (plegado: para quien quiera más detalle) ---------- */}
        <details className="tarjeta detalle-musculos">
          <summary>
            <Icono nombre="cuerpo" />
            <span>
              <strong>Series por músculo</strong>
              <small>Cuántas series le diste a cada grupo muscular ({periodo.texto.toLowerCase()})</small>
            </span>
            <Icono nombre="bajar" tamano={18} className="detalle-musculos__flecha" />
          </summary>
          <ul className="musculos-barras">
            {musculos.map((m) => (
              <li key={m.nombre}>
                <span>{m.nombre}</span>
                <div className="musculos-barras__pista">
                  <div
                    className={`musculos-barras__barra tag--${m.color}`}
                    style={{ width: `${(m.series / maxSeries) * 100}%` }}
                  />
                </div>
                <strong>{m.series}</strong>
              </li>
            ))}
          </ul>
          {rezagado && (
            <p className="texto-suave musculos-barras__nota">
              {rezagado.nombre} quedó por debajo del resto en este período.
            </p>
          )}
        </details>
      </div>
    </div>
  )
}

function Encabezado({ children }) {
  return (
    <header className="pagina__header progreso__header">
      <div>
        <h1>Progreso</h1>
        <p className="texto-suave">Tu evolución a partir de los entrenamientos que registrás.</p>
      </div>
      {children}
    </header>
  )
}

export default Progreso
