import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icono from '../iconos/Icono'
import ElegirEntreno from './ElegirEntreno'
import { useAjustes } from '../../context/ajustesContext'
import { useRutinas } from '../../context/rutinasContext'
import { useEntrenamientos } from '../../context/entrenamientosContext'
import { useAhora } from '../../hooks/useAhora'
import { formatearTiempo } from '../../hooks/useTemporizador'
import { resumenSemanal, sugerirSiguiente, esHoy, indiceDia } from '../../utils/estadisticas'
import './Principal.css'

const LETRAS_DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Duración estimada de un día de rutina: ~40 s por serie + el descanso
function duracionEstimada(dia) {
  const seg = dia.ejercicios.reduce((t, e) => t + e.series * (40 + e.descanso), 0)
  return Math.max(5, Math.round(seg / 60 / 5) * 5)
}

function Principal() {
  const { rutinas } = useRutinas()
  const { ajustes } = useAjustes()
  const objetivo = {
    titulo: ajustes.objetivoTitulo,
    descripcion: ajustes.objetivoDescripcion,
    metaSemanal: ajustes.metaSemanal,
  }
  const { historial, sesionActiva, iniciarSesion } = useEntrenamientos()
  const [eligiendo, setEligiendo] = useState(false)
  const navigate = useNavigate()

  const hoy = new Date()
  const fecha = hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const indiceHoy = indiceDia(hoy)

  const semana = resumenSemanal(historial, objetivo.metaSemanal)
  const progreso = Math.min(100, Math.round((semana.entrenamientos / objetivo.metaSemanal) * 100))
  const sugerencia = sugerirSiguiente(rutinas, historial)

  // Próximos 3 días de la rutina sugerida, en orden
  const proximos = sugerencia
    ? Array.from({ length: Math.min(3, sugerencia.rutina.dias.length) }, (_, k) => {
        const i = (sugerencia.diaIndice + k) % sugerencia.rutina.dias.length
        return { indice: i, dia: sugerencia.rutina.dias[i] }
      })
    : []

  function comenzar(rutina, diaIndice) {
    iniciarSesion(rutina, diaIndice)
    setEligiendo(false)
    navigate('/entrenamiento')
  }

  return (
    <div className="principal">
      <header className="principal__header">
        <p className="principal__fecha">{fecha}</p>
        <h1>¡Hola{ajustes.nombre ? `, ${ajustes.nombre}` : ''}!</h1>
      </header>

      <div className="principal__grilla">
        {/* ---------- Comenzar entreno ---------- */}
        <TarjetaEntreno
          sesionActiva={sesionActiva}
          ultimo={historial[historial.length - 1]}
          sugerencia={sugerencia}
          onComenzar={() => setEligiendo(true)}
        />

        {/* ---------- Objetivo ---------- */}
        <section className="tarjeta objetivo">
          <div className="tarjeta__titulo">
            <Icono nombre="objetivo" />
            <h3>Tu objetivo</h3>
            <Link to="/ajustes" className="tarjeta__link">
              Editar
            </Link>
          </div>
          <p className="objetivo__nombre">{objetivo.titulo}</p>
          <p className="texto-suave">{objetivo.descripcion}</p>

          <div className="objetivo__progreso">
            <div className="objetivo__fila">
              <span>Esta semana</span>
              <strong>
                {semana.entrenamientos} de {objetivo.metaSemanal}
              </strong>
            </div>
            <div className="barra" role="progressbar" aria-valuenow={progreso} aria-valuemin="0" aria-valuemax="100">
              <div className="barra__relleno" style={{ width: `${progreso}%` }} />
            </div>
          </div>
        </section>

        {/* ---------- Resumen de la semana ---------- */}
        <section className="tarjeta semana">
          <div className="tarjeta__titulo">
            <Icono nombre="progreso" />
            <h3>Tu semana</h3>
            <Link to="/progreso" className="tarjeta__link">
              Ver progreso <Icono nombre="flecha" tamano={14} />
            </Link>
          </div>

          <ul className="semana__dias">
            {LETRAS_DIAS.map((letra, i) => {
              const entreno = semana.dias[i]
              const clase =
                'dia' +
                (entreno ? ' dia--hecho' : '') +
                (i === indiceHoy ? ' dia--hoy' : '') +
                (i > indiceHoy ? ' dia--futuro' : '')
              return (
                <li key={i} className={clase}>
                  <span className="dia__circulo">{entreno && <Icono nombre="check" tamano={14} />}</span>
                  <span className="dia__letra">{letra}</span>
                </li>
              )
            })}
          </ul>

          <div className="semana__datos">
            <Dato valor={`${semana.entrenamientos}/${objetivo.metaSemanal}`} texto="Entrenamientos" />
            <Dato valor={`${semana.tiempoHoras} h`} texto="Tiempo total" />
            <Dato valor={`${semana.volumenKg.toLocaleString('es-AR')} kg`} texto="Volumen levantado" />
            <Dato valor={`${semana.racha} sem`} texto="Racha" />
          </div>
        </section>

        {/* ---------- Próximas rutinas ---------- */}
        <section className="tarjeta proximas">
          <div className="tarjeta__titulo">
            <Icono nombre="rutinas" />
            <h3>Próximos entrenos</h3>
            <Link to="/rutina" className="tarjeta__link">
              Ver todas <Icono nombre="flecha" tamano={14} />
            </Link>
          </div>

          {proximos.length === 0 ? (
            <p className="texto-suave">Todavía no tenés rutinas.</p>
          ) : (
            <ul className="proximas__lista">
              {proximos.map(({ indice, dia }, k) => (
                <li key={indice}>
                  <Link to={`/rutina?id=${sugerencia.rutina.id}`} className="proxima">
                    <div>
                      <p className="proxima__nombre">{dia.nombre || `Día ${indice + 1}`}</p>
                      <p className="texto-suave">
                        {dia.ejercicios.length} ejercicios · ~{duracionEstimada(dia)} min
                      </p>
                    </div>
                    <span className={'chip' + (k === 0 ? ' chip--hoy' : '')}>
                      {k === 0 ? 'Te toca' : `Día ${indice + 1}`}
                    </span>
                    <Icono nombre="chevron" tamano={18} className="proxima__chevron" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {eligiendo && (
        <ElegirEntreno
          rutinas={rutinas}
          sugerencia={sugerencia}
          onElegir={comenzar}
          onCerrar={() => setEligiendo(false)}
        />
      )}
    </div>
  )
}

// Tarjeta principal: cambia según haya un entreno en curso, ya se haya entrenado hoy o no
function TarjetaEntreno({ sesionActiva, ultimo, sugerencia, onComenzar }) {
  const ahora = useAhora()

  if (sesionActiva) {
    const transcurrido = Math.max(0, Math.floor((ahora - sesionActiva.inicio) / 1000))
    return (
      <section className="tarjeta hoy hoy--en-curso">
        <span className="etiqueta">
          <span className="punto-vivo" /> Entrenamiento en curso
        </span>
        <h2 className="hoy__nombre">{sesionActiva.diaNombre}</h2>
        <p className="hoy__detalle">
          {sesionActiva.rutinaNombre} · <strong className="hoy__reloj">{formatearTiempo(transcurrido)}</strong>
        </p>
        <Link to="/entrenamiento" className="boton">
          <Icono nombre="play" tamano={16} /> Continuar entreno
        </Link>
      </section>
    )
  }

  if (!sugerencia) {
    return (
      <section className="tarjeta hoy">
        <span className="etiqueta">Comenzar entreno</span>
        <h2 className="hoy__nombre">Creá tu primera rutina</h2>
        <p className="hoy__detalle">Necesitás una rutina para empezar a registrar tus entrenamientos.</p>
        <Link to="/rutina?id=nueva" className="boton">
          <Icono nombre="mas" tamano={16} /> Crear rutina
        </Link>
      </section>
    )
  }

  const yaEntrenoHoy = ultimo && esHoy(ultimo.inicio)
  const diaSugerido = sugerencia.rutina.dias[sugerencia.diaIndice]

  return (
    <section className="tarjeta hoy">
      {yaEntrenoHoy ? (
        <>
          <span className="etiqueta etiqueta--hecho">
            <Icono nombre="check" tamano={14} /> Hoy ya entrenaste
          </span>
          <h2 className="hoy__nombre">{ultimo.diaNombre}</h2>
          <p className="hoy__detalle">
            {ultimo.rutinaNombre} · {formatearTiempo(ultimo.duracionSeg)} ·{' '}
            {ultimo.volumen.toLocaleString('es-AR')} kg
          </p>
          <button type="button" className="boton boton--secundario" onClick={onComenzar}>
            <Icono nombre="play" tamano={16} /> Comenzar otro entreno
          </button>
        </>
      ) : (
        <>
          <span className="etiqueta">Comenzar entreno</span>
          <h2 className="hoy__nombre">{diaSugerido.nombre || `Día ${sugerencia.diaIndice + 1}`}</h2>
          <p className="hoy__detalle">
            Te toca en {sugerencia.rutina.nombre} · {diaSugerido.ejercicios.length} ejercicios
          </p>
          <button type="button" className="boton" onClick={onComenzar}>
            <Icono nombre="play" tamano={16} /> Comenzar entreno
          </button>
        </>
      )}
    </section>
  )
}

function Dato({ valor, texto }) {
  return (
    <div className="dato">
      <strong>{valor}</strong>
      <span>{texto}</span>
    </div>
  )
}

export default Principal
