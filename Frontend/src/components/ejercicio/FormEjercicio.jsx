import { useState } from 'react'
import Icono from '../iconos/Icono'
import { MUSCULOS } from '../../data/musculos'

const MAX_DESCRIPCION = 500
const MAX_IMAGEN_MB = 2 // Vercel acepta hasta 4,5 MB por petición (la imagen viaja en base64, ~35 % más grande)

function ejercicioVacio() {
  return {
    id: Date.now(),
    nombre: '',
    descripcion: '',
    musculos: [],
    consejos: [],
    errores: [],
    variantes: [],
    imagen: null,
    personalizado: true,
  }
}

function FormEjercicio({ ejercicioInicial, onGuardar, onEliminar, onVolver }) {
  const esNuevo = ejercicioInicial === null
  const [ej, setEj] = useState(() =>
    esNuevo
      ? ejercicioVacio()
      : {
          // los ejercicios de ejemplo pueden no tener todos los campos
          descripcion: '',
          consejos: [],
          errores: [],
          variantes: [],
          imagen: null,
          ...structuredClone(ejercicioInicial),
        }
  )
  const [errores, setErrores] = useState({})

  function cambiar(campo, valor) {
    setEj((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  function toggleMusculo(nombre) {
    const lista = ej.musculos.includes(nombre)
      ? ej.musculos.filter((m) => m !== nombre)
      : [...ej.musculos, nombre]
    cambiar('musculos', lista)
  }

  function handleImagen(e) {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!archivo) return
    if (archivo.size > MAX_IMAGEN_MB * 1024 * 1024) {
      setErrores((prev) => ({ ...prev, imagen: `La imagen no puede pesar más de ${MAX_IMAGEN_MB} MB.` }))
      return
    }
    const lector = new FileReader()
    lector.onload = () => cambiar('imagen', lector.result)
    lector.readAsDataURL(archivo)
  }

  function handleGuardar() {
    const nuevosErrores = {}
    if (!ej.nombre.trim()) nuevosErrores.nombre = 'Ingresá el nombre del ejercicio.'
    if (ej.musculos.length === 0) nuevosErrores.musculos = 'Elegí al menos un músculo.'
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    onGuardar({ ...ej, nombre: ej.nombre.trim(), descripcion: ej.descripcion.trim() })
  }

  function handleEliminar() {
    if (window.confirm(`¿Eliminar "${ej.nombre}"? Las rutinas que lo usan lo van a mostrar como eliminado.`)) {
      onEliminar(ej.id)
    }
  }

  return (
    <div className="form-ej">
      <button type="button" className="editor__volver" onClick={onVolver}>
        <Icono nombre="volver" tamano={18} /> Volver a ejercicios
      </button>

      <header className="pagina__header ejercicios__header">
        <div>
          <h1>{esNuevo ? 'Crear ejercicio' : 'Editar ejercicio'}</h1>
          <p className="texto-suave">
            {esNuevo ? 'Agregá un nuevo ejercicio a tu biblioteca.' : 'Modificá los datos del ejercicio.'}
          </p>
        </div>
        <button type="button" className="boton solo-escritorio" onClick={handleGuardar}>
          Guardar ejercicio
        </button>
      </header>

      <div className="form-ej__grilla">
        <div className="form-ej__principal">
          {/* ---------- Información básica ---------- */}
          <section className="tarjeta">
            <h3 className="seccion__titulo">Información básica</h3>

            <div className={'campo' + (errores.nombre ? ' campo--error' : '')}>
              <label htmlFor="ej-nombre">
                Nombre del ejercicio <span className="requerido">*</span>
              </label>
              <input
                id="ej-nombre"
                value={ej.nombre}
                placeholder="Ej: Press de banca plano"
                onChange={(e) => cambiar('nombre', e.target.value)}
              />
              {errores.nombre && <span className="campo__mensaje">{errores.nombre}</span>}
            </div>

            <div className="campo">
              <label htmlFor="ej-descripcion">Descripción</label>
              <textarea
                id="ej-descripcion"
                rows={4}
                maxLength={MAX_DESCRIPCION}
                value={ej.descripcion}
                placeholder="¿Qué trabaja y cómo se hace?"
                onChange={(e) => cambiar('descripcion', e.target.value)}
              />
              <span className="contador">
                {ej.descripcion.length}/{MAX_DESCRIPCION}
              </span>
            </div>
          </section>

          {/* ---------- Músculos ---------- */}
          <section className="tarjeta">
            <h3 className="seccion__titulo">
              Músculos objetivo <span className="requerido">*</span>
            </h3>
            <p className="texto-suave">Elegí los músculos que trabaja este ejercicio.</p>

            <div className="musculos">
              {MUSCULOS.map((m) => {
                const elegido = ej.musculos.includes(m.nombre)
                return (
                  <button
                    key={m.nombre}
                    type="button"
                    aria-pressed={elegido}
                    className={`musculo tag--${m.color}` + (elegido ? ' musculo--elegido' : '')}
                    onClick={() => toggleMusculo(m.nombre)}
                  >
                    <span className="musculo__check">{elegido && <Icono nombre="check" tamano={12} />}</span>
                    {m.nombre}
                  </button>
                )
              })}
            </div>
            {errores.musculos && <span className="campo__mensaje">{errores.musculos}</span>}
          </section>

          {/* ---------- Variantes y consejos ---------- */}
          <section className="tarjeta">
            <h3 className="seccion__titulo">Variantes y consejos</h3>

            <Desplegable
              icono="foco"
              color="ambar"
              titulo="Consejos de ejecución"
              items={ej.consejos}
              placeholder="Ej: Bajá la barra controlada"
              onChange={(lista) => cambiar('consejos', lista)}
            />
            <Desplegable
              icono="alerta"
              color="rosa"
              titulo="Errores comunes"
              items={ej.errores}
              placeholder="Ej: Rebotar la barra en el pecho"
              onChange={(lista) => cambiar('errores', lista)}
            />
            <Desplegable
              icono="cambiar"
              color="azul"
              titulo="Variantes del ejercicio"
              items={ej.variantes}
              placeholder="Ej: Press con mancuernas"
              onChange={(lista) => cambiar('variantes', lista)}
            />
          </section>
        </div>

        {/* ---------- Imagen ---------- */}
        <aside className="tarjeta form-ej__imagen">
          <h3 className="seccion__titulo">Imagen</h3>
          {ej.imagen ? (
            <img src={ej.imagen} alt={`Imagen de ${ej.nombre || 'ejercicio'}`} className="imagen__preview" />
          ) : (
            <div className="imagen__vacia">
              <Icono nombre="camara" tamano={32} />
              <span>Sin imagen</span>
            </div>
          )}

          <div className="imagen__acciones">
            <label className="boton boton--secundario">
              <Icono nombre="camara" tamano={18} />
              {ej.imagen ? 'Cambiar' : 'Subir imagen'}
              <input type="file" accept="image/*" onChange={handleImagen} hidden />
            </label>
            {ej.imagen && (
              <button type="button" className="boton boton--secundario" onClick={() => cambiar('imagen', null)}>
                Quitar
              </button>
            )}
          </div>
          {errores.imagen && <span className="campo__mensaje">{errores.imagen}</span>}
          <p className="texto-suave imagen__nota">Opcional. Podés sacarle una foto a la máquina del gimnasio.</p>
        </aside>
      </div>

      {/* ---------- Acciones ---------- */}
      <div className="editor__acciones">
        {!esNuevo && (
          <button type="button" className="boton boton--peligro" onClick={handleEliminar}>
            <Icono nombre="basura" tamano={18} /> Eliminar
          </button>
        )}
        <button type="button" className="boton boton--secundario" onClick={onVolver}>
          Cancelar
        </button>
        <button type="button" className="boton" onClick={handleGuardar}>
          Guardar ejercicio
        </button>
      </div>
    </div>
  )
}

/**
 * Sección que se abre y cierra, con una lista de textos editable.
 * Se agrega un ítem escribiendo y apretando Enter o el botón "+".
 */
function Desplegable({ icono, color, titulo, items, placeholder, onChange }) {
  const [abierto, setAbierto] = useState(items.length > 0)
  const [texto, setTexto] = useState('')

  function agregar() {
    const limpio = texto.trim()
    if (!limpio) return
    onChange([...items, limpio])
    setTexto('')
  }

  return (
    <div className={'desplegable' + (abierto ? ' desplegable--abierto' : '')}>
      <button
        type="button"
        className="desplegable__header"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
      >
        <span className={`desplegable__icono tag--${color}`}>
          <Icono nombre={icono} tamano={16} />
        </span>
        <span className="desplegable__titulo">{titulo}</span>
        {items.length > 0 && <span className="chip">{items.length}</span>}
        <Icono nombre="bajar" tamano={18} className="desplegable__flecha" />
      </button>

      {abierto && (
        <div className="desplegable__cuerpo">
          {items.length > 0 && (
            <ul className="desplegable__lista">
              {items.map((item, i) => (
                <li key={i}>
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                    aria-label={`Quitar "${item}"`}
                  >
                    <Icono nombre="cerrar" tamano={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="desplegable__agregar">
            <input
              value={texto}
              placeholder={placeholder}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregar()
                }
              }}
            />
            <button type="button" onClick={agregar} aria-label="Agregar" disabled={!texto.trim()}>
              <Icono nombre="mas" tamano={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormEjercicio
