import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../iconos/Icono'
import { useAjustes } from '../../context/ajustesContext'
import { useEntrenamientos } from '../../context/entrenamientosContext'
import { useEjercicios } from '../../context/ejerciciosContext'
import { useAuth } from '../../context/authContext'
import { exportarCSV, exportarCopia, leerCopia, restaurarCopia, borrarTodoYReiniciar } from '../../utils/exportar'
import './Ajustes.css'

/**
 * Ajustes: perfil, objetivo, preferencias del entrenamiento y manejo de datos.
 * Todos los cambios se guardan solos al modificarlos.
 */
function Ajustes() {
  const { ajustes, cambiarAjuste } = useAjustes()
  const { historial, borrarDemo } = useEntrenamientos()
  const { buscarEjercicio } = useEjercicios()
  const { usuario, cerrarSesion } = useAuth()
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'ok' | 'error', texto }
  const inputCopia = useRef(null)
  const navigate = useNavigate()

  const iniciales = ((ajustes.nombre[0] ?? '') + (ajustes.apellido[0] ?? '')).toUpperCase() || '?'
  const cantidadDemo = historial.filter((s) => s.demo).length
  const cantidadReal = historial.length - cantidadDemo

  function avisar(tipo, texto) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 4000)
  }

  async function handleRestaurar(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    try {
      const copia = await leerCopia(archivo)
      const fecha = new Date(copia.fecha).toLocaleDateString('es-AR')
      if (window.confirm(`¿Restaurar la copia del ${fecha}? Se reemplazan todos tus datos actuales.`)) {
        setOcupado(true)
        await restaurarCopia(copia)
      }
    } catch (err) {
      avisar('error', err.message)
      setOcupado(false)
    }
  }

  async function handleBorrarTodo() {
    if (!window.confirm('¿Borrar TODOS tus datos? Se pierden rutinas, ejercicios propios e historial.')) return
    if (!window.confirm('Esto no se puede deshacer. ¿Seguro?')) return
    setOcupado(true)
    try {
      await borrarTodoYReiniciar()
    } catch (err) {
      avisar('error', err.message)
      setOcupado(false)
    }
  }

  async function handleCopia() {
    try {
      await exportarCopia()
      avisar('ok', 'Copia descargada.')
    } catch (err) {
      avisar('error', err.message)
    }
  }

  function handleCerrarSesion() {
    cerrarSesion()
    navigate('/login')
  }

  return (
    <div className="ajustes">
      <header className="pagina__header">
        <h1>Ajustes</h1>
        <p className="texto-suave">Los cambios se guardan automáticamente.</p>
      </header>

      {mensaje && (
        <p className={`ajustes__mensaje ajustes__mensaje--${mensaje.tipo}`} role="status">
          <Icono nombre={mensaje.tipo === 'ok' ? 'check' : 'alerta'} tamano={16} /> {mensaje.texto}
        </p>
      )}

      {/* ---------- Perfil ---------- */}
      <Seccion titulo="Perfil" descripcion="Cómo aparecés en la app.">
        <div className="ajustes__perfil">
          <span className="ajustes__avatar">{iniciales}</span>
          <div className="ajustes__campos">
            <Campo id="aj-nombre" label="Nombre">
              <input
                id="aj-nombre"
                value={ajustes.nombre}
                autoComplete="given-name"
                onChange={(e) => cambiarAjuste('nombre', e.target.value)}
              />
            </Campo>
            <Campo id="aj-apellido" label="Apellido">
              <input
                id="aj-apellido"
                value={ajustes.apellido}
                autoComplete="family-name"
                onChange={(e) => cambiarAjuste('apellido', e.target.value)}
              />
            </Campo>
          </div>
        </div>
      </Seccion>

      {/* ---------- Objetivo ---------- */}
      <Seccion titulo="Tu objetivo" descripcion="Se muestra en el inicio y define tu meta semanal.">
        <Campo id="aj-objetivo" label="Objetivo">
          <input
            id="aj-objetivo"
            value={ajustes.objetivoTitulo}
            placeholder="Ej: Ganar fuerza"
            onChange={(e) => cambiarAjuste('objetivoTitulo', e.target.value)}
          />
        </Campo>
        <Campo id="aj-desc" label="Descripción">
          <textarea
            id="aj-desc"
            rows={2}
            value={ajustes.objetivoDescripcion}
            onChange={(e) => cambiarAjuste('objetivoDescripcion', e.target.value)}
          />
        </Campo>
        <div className="ajustes__fila">
          <div>
            <strong>Meta semanal</strong>
            <span>Entrenamientos por semana para cumplir tu racha.</span>
          </div>
          <div className="contador-num" role="group" aria-label="Meta semanal">
            <button
              type="button"
              aria-label="Menos"
              disabled={ajustes.metaSemanal <= 1}
              onClick={() => cambiarAjuste('metaSemanal', ajustes.metaSemanal - 1)}
            >
              −
            </button>
            <strong aria-live="polite">{ajustes.metaSemanal}</strong>
            <button
              type="button"
              aria-label="Más"
              disabled={ajustes.metaSemanal >= 7}
              onClick={() => cambiarAjuste('metaSemanal', ajustes.metaSemanal + 1)}
            >
              +
            </button>
          </div>
        </div>
      </Seccion>

      {/* ---------- Entrenamiento ---------- */}
      <Seccion titulo="Durante el entrenamiento">
        <Interruptor
          titulo="Sonido al terminar el descanso"
          descripcion="Un pitido corto cuando se termina el temporizador."
          activo={ajustes.sonido}
          onChange={(v) => cambiarAjuste('sonido', v)}
        />
        <Interruptor
          titulo="Vibración al terminar el descanso"
          descripcion="Solo en Android: el iPhone no permite vibrar desde una página web."
          activo={ajustes.vibracion}
          onChange={(v) => cambiarAjuste('vibracion', v)}
        />
        <Interruptor
          titulo="Mantener la pantalla encendida"
          descripcion="Evita que el celular se bloquee mientras entrenás."
          activo={ajustes.pantallaEncendida}
          onChange={(v) => cambiarAjuste('pantallaEncendida', v)}
        />
      </Seccion>

      {/* ---------- Datos ---------- */}
      <Seccion
        titulo="Tus datos"
        descripcion="Tus datos se guardan en el servidor. Podés descargar una copia cuando quieras."
      >
        <Accion
          titulo="Exportar historial a Excel"
          descripcion={`${cantidadReal} entrenamientos, una fila por serie (archivo .csv).`}
          boton="Exportar"
          deshabilitado={historial.length === 0}
          onClick={() => {
            exportarCSV(historial, buscarEjercicio)
            avisar('ok', 'Historial exportado.')
          }}
        />
        <Accion
          titulo="Descargar copia de seguridad"
          descripcion="Rutinas, ejercicios, historial y ajustes en un solo archivo."
          boton="Descargar"
          onClick={handleCopia}
        />
        <Accion
          titulo="Restaurar una copia"
          descripcion="Reemplaza los datos actuales por los de un archivo de copia."
          boton="Elegir archivo"
          deshabilitado={ocupado}
          onClick={() => inputCopia.current?.click()}
        />
        <input ref={inputCopia} type="file" accept="application/json,.json" onChange={handleRestaurar} hidden />

        {cantidadDemo > 0 && (
          <Accion
            titulo="Borrar datos de ejemplo"
            descripcion={`${cantidadDemo} entrenamientos de prueba. Tus entrenamientos reales no se tocan.`}
            boton="Borrar"
            onClick={() => {
              borrarDemo()
              avisar('ok', 'Datos de ejemplo borrados.')
            }}
          />
        )}
        <Accion
          titulo="Borrar todos los datos"
          descripcion="Deja tu cuenta como recién creada. No se puede deshacer."
          boton="Borrar todo"
          peligro
          deshabilitado={ocupado}
          onClick={handleBorrarTodo}
        />
      </Seccion>

      {/* ---------- Cuenta ---------- */}
      <Seccion titulo="Cuenta">
        <Accion
          titulo="Cerrar sesión"
          descripcion={`Sesión iniciada como ${usuario.email}.`}
          boton="Cerrar sesión"
          onClick={handleCerrarSesion}
        />
      </Seccion>
    </div>
  )
}

function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="tarjeta ajustes__seccion">
      <div className="ajustes__seccion-titulo">
        <h2>{titulo}</h2>
        {descripcion && <p className="texto-suave">{descripcion}</p>}
      </div>
      <div className="ajustes__seccion-cuerpo">{children}</div>
    </section>
  )
}

function Campo({ id, label, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  )
}

function Interruptor({ titulo, descripcion, activo, onChange }) {
  return (
    <label className="ajustes__fila ajustes__fila--clic">
      <div>
        <strong>{titulo}</strong>
        <span>{descripcion}</span>
      </div>
      <input
        type="checkbox"
        role="switch"
        className="interruptor"
        checked={activo}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

function Accion({ titulo, descripcion, boton, onClick, peligro, deshabilitado }) {
  return (
    <div className="ajustes__fila">
      <div>
        <strong>{titulo}</strong>
        <span>{descripcion}</span>
      </div>
      <button
        type="button"
        className={'boton boton--secundario ajustes__boton' + (peligro ? ' boton--peligro' : '')}
        onClick={onClick}
        disabled={deshabilitado}
      >
        {boton}
      </button>
    </div>
  )
}

export default Ajustes
