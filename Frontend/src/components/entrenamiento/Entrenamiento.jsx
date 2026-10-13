import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icono from '../iconos/Icono'
import { useEntrenamientos } from '../../context/entrenamientosContext'
import { useEjercicios } from '../../context/ejerciciosContext'
import { useAjustes } from '../../context/ajustesContext'
import { useTemporizador, formatearTiempo } from '../../hooks/useTemporizador'
import { useAhora } from '../../hooks/useAhora'
import { colorMusculo } from '../../data/musculos'
import './Entrenamiento.css'

/**
 * Entrenamiento en tiempo real.
 * - Cronómetro con el tiempo total desde que empezó.
 * - Por cada ejercicio, una fila por serie para anotar peso y repeticiones.
 * - Cada ejercicio tiene su propio cronómetro de descanso (a la izquierda de la tarjeta).
 *   Arranca solo al marcar una serie como hecha, o a mano con "Iniciar".
 * - Al finalizar se guarda en el historial y se muestra un resumen.
 *
 * El entrenamiento en curso se guarda en el navegador, así que si se recarga
 * la página o se bloquea el celular, se sigue desde donde quedó.
 */
function Entrenamiento() {
  const { sesionActiva, actualizarSesion, finalizarSesion, cancelarSesion, ultimoRegistro } =
    useEntrenamientos()
  const { buscarEjercicio } = useEjercicios()
  const { ajustes } = useAjustes()
  const [resumen, setResumen] = useState(null)
  const navigate = useNavigate()

  usePantallaEncendida(Boolean(sesionActiva) && ajustes.pantallaEncendida)

  if (resumen) {
    return <Resumen registro={resumen} buscarEjercicio={buscarEjercicio} />
  }

  if (!sesionActiva) {
    return (
      <div className="entreno entreno--vacio">
        <Icono nombre="pesa" tamano={40} />
        <h1>No hay ningún entrenamiento en curso</h1>
        <p className="texto-suave">Comenzá uno desde el inicio eligiendo tu rutina.</p>
        <Link to="/" className="boton">
          Ir al inicio
        </Link>
      </div>
    )
  }

  const todasLasSeries = sesionActiva.ejercicios.flatMap((e) => e.series)
  const hechas = todasLasSeries.filter((s) => s.hecha).length
  const total = todasLasSeries.length

  // ---------- Cambios en las series ----------
  function modificarEjercicio(ei, fn) {
    actualizarSesion((s) => ({
      ...s,
      ejercicios: s.ejercicios.map((e, i) => (i === ei ? fn(e) : e)),
    }))
  }

  function cambiarSerie(ei, si, campo, valor) {
    modificarEjercicio(ei, (e) => ({
      ...e,
      series: e.series.map((s, j) => (j === si ? { ...s, [campo]: valor } : s)),
    }))
  }

  // Marca o desmarca una serie. Devuelve true si la marcó (para arrancar el descanso).
  function toggleSerie(ei, si, anterior) {
    const ej = sesionActiva.ejercicios[ei]
    const serie = ej.series[si]
    const marcar = !serie.hecha

    modificarEjercicio(ei, (e) => ({
      ...e,
      series: e.series.map((s, j) => {
        if (j !== si) return s
        if (!marcar) return { ...s, hecha: false }
        // Si no se escribió nada, se usa lo de la vez anterior (o las reps objetivo)
        return {
          ...s,
          hecha: true,
          peso: s.peso || (anterior ? String(anterior.peso) : ''),
          reps: s.reps || (anterior ? String(anterior.reps) : String(parseInt(e.repsObjetivo) || '')),
        }
      }),
    }))

    return marcar
  }

  function agregarSerie(ei) {
    modificarEjercicio(ei, (e) => ({
      ...e,
      series: [...e.series, { peso: '', reps: '', hecha: false }],
    }))
  }

  function quitarSerie(ei) {
    modificarEjercicio(ei, (e) => (e.series.length > 1 ? { ...e, series: e.series.slice(0, -1) } : e))
  }

  // ---------- Terminar ----------
  function finalizar() {
    if (hechas === 0) {
      if (window.confirm('No completaste ninguna serie. ¿Querés descartar este entrenamiento?')) {
        cancelarSesion()
        navigate('/')
      }
      return
    }
    const faltan = total - hechas
    if (faltan > 0 && !window.confirm(`Te faltan ${faltan} series. ¿Terminar igual?`)) return

    setResumen(finalizarSesion())
    window.scrollTo({ top: 0 })
  }

  function cancelar() {
    if (window.confirm('¿Cancelar el entrenamiento? No se va a guardar nada.')) {
      cancelarSesion()
      navigate('/')
    }
  }

  return (
    <div className="entreno">
      <Cabecera sesion={sesionActiva} hechas={hechas} total={total} onFinalizar={finalizar} />

      <ol className="entreno__lista">
        {sesionActiva.ejercicios.map((ej, ei) => (
          <TarjetaEjercicio
            key={ej.uid}
            numero={ei + 1}
            ej={ej}
            info={buscarEjercicio(ej.ejercicioId)}
            anterior={ultimoRegistro(ej.ejercicioId)}
            onCambiar={(si, campo, valor) => cambiarSerie(ei, si, campo, valor)}
            onToggle={(si, anterior) => toggleSerie(ei, si, anterior)}
            onAgregar={() => agregarSerie(ei)}
            onQuitar={() => quitarSerie(ei)}
          />
        ))}
      </ol>

      <div className="entreno__acciones">
        <button type="button" className="boton boton--peligro" onClick={cancelar}>
          Cancelar entreno
        </button>
        <button type="button" className="boton" onClick={finalizar}>
          <Icono nombre="check" tamano={18} /> Finalizar entreno
        </button>
      </div>
    </div>
  )
}

// ---------- Cabecera con cronómetro ----------
function Cabecera({ sesion, hechas, total, onFinalizar }) {
  const ahora = useAhora()
  const transcurrido = Math.max(0, Math.floor((ahora - sesion.inicio) / 1000))
  const porcentaje = total ? Math.round((hechas / total) * 100) : 0

  return (
    <header className="entreno__cabecera">
      <div className="entreno__titulo">
        <span className="etiqueta">
          <span className="punto-vivo" /> {sesion.rutinaNombre}
        </span>
        <h1>{sesion.diaNombre}</h1>
      </div>

      <div className="entreno__reloj" aria-label="Tiempo de entrenamiento">
        <Icono nombre="reloj" tamano={18} />
        <span>{formatearTiempo(transcurrido)}</span>
      </div>

      <button type="button" className="boton entreno__finalizar" onClick={onFinalizar}>
        Finalizar
      </button>

      <div className="entreno__progreso">
        <div className="barra">
          <div className="barra__relleno" style={{ width: `${porcentaje}%` }} />
        </div>
        <span>
          {hechas}/{total} series
        </span>
      </div>
    </header>
  )
}

// ---------- Un ejercicio con sus series ----------
function TarjetaEjercicio({ numero, ej, info, anterior, onCambiar, onToggle, onAgregar, onQuitar }) {
  const hechas = ej.series.filter((s) => s.hecha).length
  const completo = hechas === ej.series.length

  // Cronómetro de descanso propio de este ejercicio
  const [listo, setListo] = useState(false)
  const temporizador = useTemporizador(() => setListo(true))

  useEffect(() => {
    if (!listo) return
    const id = setTimeout(() => setListo(false), 4000)
    return () => clearTimeout(id)
  }, [listo])

  function iniciarDescanso() {
    setListo(false)
    temporizador.iniciar(ej.uid, ej.descanso)
  }

  function toggle(si, prev) {
    const marco = onToggle(si, prev)
    // al terminar una serie arranca el descanso (salvo que fuera la última)
    if (marco && hechas + 1 < ej.series.length) iniciarDescanso()
  }

  return (
    <li className={'ej-vivo' + (completo ? ' ej-vivo--completo' : '')}>
      <CronometroDescanso
        temporizador={temporizador}
        descanso={ej.descanso}
        listo={listo}
        nombre={info?.nombre}
        onIniciar={iniciarDescanso}
      />

      <div className="ej-vivo__contenido">
      <div className="ej-vivo__header">
        <span className="fila__numero">{completo ? <Icono nombre="check" tamano={16} /> : numero}</span>
        <div className="ej-vivo__info">
          <p className="ej-vivo__nombre">{info?.nombre ?? 'Ejercicio eliminado'}</p>
          <p className="texto-suave">
            {ej.series.length} × {ej.repsObjetivo} · {ej.descanso} s descanso
          </p>
        </div>
        <div className="fila__tags ej-vivo__tags">
          {info?.musculos.map((m) => (
            <span key={m} className={`tag tag--${colorMusculo(m)}`}>
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="series" role="table" aria-label={`Series de ${info?.nombre ?? 'ejercicio'}`}>
        <div className="serie serie--titulos" role="row">
          <span role="columnheader">Serie</span>
          <span role="columnheader">Anterior</span>
          <span role="columnheader">Kg</span>
          <span role="columnheader">Reps</span>
          <span role="columnheader" className="sr-only">
            Hecha
          </span>
        </div>

        {ej.series.map((s, si) => {
          const prev = anterior?.series[si] ?? anterior?.series[anterior.series.length - 1]
          return (
            <div key={si} className={'serie' + (s.hecha ? ' serie--hecha' : '')} role="row">
              <span className="serie__numero">{si + 1}</span>
              <span className="serie__anterior">{prev ? `${prev.peso} × ${prev.reps}` : '—'}</span>
              <input
                type="text"
                inputMode="decimal"
                aria-label={`Peso serie ${si + 1}`}
                placeholder={prev ? String(prev.peso) : '0'}
                value={s.peso}
                onChange={(e) => {
                  const v = e.target.value.replace(',', '.')
                  if (/^\d*\.?\d*$/.test(v)) onCambiar(si, 'peso', v)
                }}
              />
              <input
                type="text"
                inputMode="numeric"
                aria-label={`Repeticiones serie ${si + 1}`}
                placeholder={prev ? String(prev.reps) : String(parseInt(ej.repsObjetivo) || '')}
                value={s.reps}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) onCambiar(si, 'reps', e.target.value)
                }}
              />
              <button
                type="button"
                className="serie__check"
                aria-pressed={s.hecha}
                aria-label={s.hecha ? `Desmarcar serie ${si + 1}` : `Marcar serie ${si + 1} como hecha`}
                onClick={() => toggle(si, prev)}
              >
                <Icono nombre="check" tamano={18} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="ej-vivo__pie">
        <button type="button" onClick={onAgregar}>
          <Icono nombre="mas" tamano={16} /> Serie
        </button>
        {ej.series.length > 1 && (
          <button type="button" onClick={onQuitar}>
            <Icono nombre="cerrar" tamano={16} /> Quitar última
          </button>
        )}
        {anterior && (
          <span className="ej-vivo__fecha">
            Última vez: {new Date(anterior.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      </div>
    </li>
  )
}

// ---------- Cronómetro de descanso de un ejercicio ----------
const RADIO = 46
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

function CronometroDescanso({ temporizador, descanso, listo, nombre, onIniciar }) {
  const { activo } = temporizador
  const restante = activo ? activo.restante : descanso
  const fraccion = activo ? activo.restante / activo.total : 1
  const estado = activo ? 'activo' : listo ? 'listo' : 'quieto'

  return (
    <div className={`crono crono--${estado}`} role="timer" aria-label={`Descanso de ${nombre ?? 'ejercicio'}`}>
      <span className="crono__label">
        {estado === 'activo' ? 'Descansando' : estado === 'listo' ? '¡A la próxima serie!' : 'Descanso'}
      </span>

      <div className="crono__anillo">
        <svg viewBox="0 0 110 110" aria-hidden="true">
          <circle cx="55" cy="55" r={RADIO} className="crono__pista" />
          <circle
            cx="55"
            cy="55"
            r={RADIO}
            className="crono__progreso"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - fraccion)}
          />
        </svg>
        <strong aria-live="polite">{estado === 'listo' ? <Icono nombre="check" tamano={30} /> : formatearTiempo(restante)}</strong>
      </div>

      {activo ? (
        <div className="crono__acciones">
          <div className="crono__ajustar">
            <button type="button" onClick={() => temporizador.sumar(-15)} aria-label="Restar 15 segundos">
              −15
            </button>
            <button type="button" onClick={() => temporizador.sumar(15)} aria-label="Sumar 15 segundos">
              +15
            </button>
          </div>
          <button type="button" className="crono__principal crono__principal--saltar" onClick={temporizador.detener}>
            Saltar
          </button>
        </div>
      ) : (
        <div className="crono__acciones">
          <button type="button" className="crono__principal" onClick={onIniciar}>
            <Icono nombre="play" tamano={14} /> Iniciar
          </button>
        </div>
      )}
    </div>
  )
}

// ---------- Resumen al terminar ----------
function Resumen({ registro, buscarEjercicio }) {
  const series = registro.ejercicios.reduce((t, e) => t + e.series.length, 0)

  return (
    <div className="entreno resumen">
      <div className="resumen__icono">
        <Icono nombre="check" tamano={32} />
      </div>
      <h1>¡Entreno terminado!</h1>
      <p className="texto-suave">
        {registro.rutinaNombre} · {registro.diaNombre}
      </p>

      <div className="resumen__datos">
        <div className="dato">
          <strong>{formatearTiempo(registro.duracionSeg)}</strong>
          <span>Duración</span>
        </div>
        <div className="dato">
          <strong>{series}</strong>
          <span>Series</span>
        </div>
        <div className="dato">
          <strong>{registro.volumen.toLocaleString('es-AR')} kg</strong>
          <span>Volumen</span>
        </div>
        <div className="dato">
          <strong>{registro.ejercicios.length}</strong>
          <span>Ejercicios</span>
        </div>
      </div>

      <ul className="resumen__lista">
        {registro.ejercicios.map((e) => (
          <li key={e.ejercicioId}>
            <strong>{buscarEjercicio(e.ejercicioId)?.nombre ?? 'Ejercicio'}</strong>
            <span className="texto-suave">{e.series.map((s) => `${s.peso}×${s.reps}`).join(' · ')}</span>
          </li>
        ))}
      </ul>

      <Link to="/" className="boton">
        Volver al inicio
      </Link>
    </div>
  )
}

// Evita que la pantalla del celular se apague mientras entrenás (si el navegador lo permite)
function usePantallaEncendida(activo) {
  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return
    let bloqueo = null

    const pedir = async () => {
      try {
        bloqueo = await navigator.wakeLock.request('screen')
      } catch {
        // no se pudo (por ejemplo, batería baja): no pasa nada
      }
    }
    // Al volver a la app hay que pedirlo de nuevo
    const alVolver = () => document.visibilityState === 'visible' && pedir()

    pedir()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      bloqueo?.release().catch(() => {})
    }
  }, [activo])
}

export default Entrenamiento
