import { useState } from 'react'
import Icono from '../iconos/Icono'
import FilaEjercicio from './FilaEjercicio'
import SelectorEjercicio from './SelectorEjercicio'
import { OBJETIVOS } from '../../data/mockData'

const OPCIONES_DIAS = [1, 2, 3, 4, 5, 6]

function nuevoDia(numero) {
  return { nombre: `Día ${numero}`, ejercicios: [] }
}

function rutinaVacia() {
  return {
    id: Date.now(),
    nombre: '',
    objetivo: OBJETIVOS[0],
    diasPorSemana: 3,
    dias: [nuevoDia(1), nuevoDia(2), nuevoDia(3)],
  }
}

// Copia profunda para no modificar la rutina original hasta guardar
function copiar(rutina) {
  return structuredClone(rutina)
}

function EditorRutina({ rutinaInicial, onGuardar, onEliminar, onVolver }) {
  const esNueva = rutinaInicial === null
  const [rutina, setRutina] = useState(() => (esNueva ? rutinaVacia() : copiar(rutinaInicial)))
  const [diaActivo, setDiaActivo] = useState(0)
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [errorNombre, setErrorNombre] = useState('')

  const dia = rutina.dias[diaActivo]

  // ---------- Cambios en la rutina ----------
  function cambiarCampo(campo, valor) {
    setRutina((r) => ({ ...r, [campo]: valor }))
  }

  function cambiarDiasPorSemana(cantidad) {
    setRutina((r) => {
      const dias = r.dias.slice(0, cantidad)
      while (dias.length < cantidad) dias.push(nuevoDia(dias.length + 1))
      return { ...r, diasPorSemana: cantidad, dias }
    })
    if (diaActivo >= cantidad) setDiaActivo(cantidad - 1)
  }

  // Aplica una función a los ejercicios del día activo
  function actualizarEjercicios(fn) {
    setRutina((r) => ({
      ...r,
      dias: r.dias.map((d, i) => (i === diaActivo ? { ...d, ejercicios: fn(d.ejercicios) } : d)),
    }))
  }

  function cambiarNombreDia(nombre) {
    setRutina((r) => ({
      ...r,
      dias: r.dias.map((d, i) => (i === diaActivo ? { ...d, nombre } : d)),
    }))
  }

  function agregarEjercicio(ejercicio) {
    actualizarEjercicios((lista) => [
      ...lista,
      {
        uid: crypto.randomUUID(),
        ejercicioId: ejercicio.id,
        series: 3,
        reps: '10 - 12',
        descanso: 60,
      },
    ])
    setSelectorAbierto(false)
  }

  function cambiarEjercicio(uid, campo, valor) {
    actualizarEjercicios((lista) => lista.map((e) => (e.uid === uid ? { ...e, [campo]: valor } : e)))
  }

  function quitarEjercicio(uid) {
    actualizarEjercicios((lista) => lista.filter((e) => e.uid !== uid))
  }

  function moverEjercicio(indice, direccion) {
    actualizarEjercicios((lista) => {
      const destino = indice + direccion
      if (destino < 0 || destino >= lista.length) return lista
      const copia = [...lista]
      ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
      return copia
    })
  }

  // ---------- Guardar / eliminar ----------
  function handleGuardar() {
    if (!rutina.nombre.trim()) {
      setErrorNombre('Ponele un nombre a la rutina.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    onGuardar({ ...rutina, nombre: rutina.nombre.trim() })
  }

  function handleEliminar() {
    if (window.confirm(`¿Eliminar la rutina "${rutina.nombre}"?`)) {
      onEliminar(rutina.id)
    }
  }

  return (
    <div className="editor">
      <button type="button" className="editor__volver" onClick={onVolver}>
        <Icono nombre="volver" tamano={18} /> Volver
      </button>

      <header className="pagina__header">
        <h1>{esNueva ? 'Crear rutina' : 'Editar rutina'}</h1>
        <p className="texto-suave">Agregá ejercicios, series, repeticiones y descansos.</p>
      </header>

      {/* ---------- Datos generales ---------- */}
      <div className="editor__datos">
        <div className={'campo' + (errorNombre ? ' campo--error' : '')}>
          <label htmlFor="nombre-rutina">
            Nombre de la rutina <span className="requerido">*</span>
          </label>
          <input
            id="nombre-rutina"
            value={rutina.nombre}
            placeholder="Ej: Push - Torso"
            onChange={(e) => {
              cambiarCampo('nombre', e.target.value)
              setErrorNombre('')
            }}
          />
          {errorNombre && <span className="campo__mensaje">{errorNombre}</span>}
        </div>

        <div className="campo">
          <label htmlFor="objetivo-rutina">Objetivo</label>
          <select
            id="objetivo-rutina"
            value={rutina.objetivo}
            onChange={(e) => cambiarCampo('objetivo', e.target.value)}
          >
            {OBJETIVOS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="dias-rutina">Días por semana</label>
          <select
            id="dias-rutina"
            value={rutina.diasPorSemana}
            onChange={(e) => cambiarDiasPorSemana(Number(e.target.value))}
          >
            {OPCIONES_DIAS.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'día' : 'días'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------- Pestañas de días ---------- */}
      <div className="editor__dias" role="tablist">
        {rutina.dias.map((d, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === diaActivo}
            className={'editor__dia' + (i === diaActivo ? ' editor__dia--activo' : '')}
            onClick={() => setDiaActivo(i)}
          >
            <span>Día {i + 1}</span>
            <small>{d.ejercicios.length} ej.</small>
          </button>
        ))}
      </div>

      {/* ---------- Ejercicios del día ---------- */}
      <section className="tarjeta editor__panel">
        <div className="editor__panel-header">
          <div className="editor__dia-nombre">
            <span>Día {diaActivo + 1} ·</span>
            <input
              value={dia.nombre}
              onChange={(e) => cambiarNombreDia(e.target.value)}
              aria-label="Nombre del día"
              placeholder="Ej: Pecho + Tríceps"
            />
            <Icono nombre="lapiz" tamano={16} />
          </div>
          <button type="button" className="boton boton--chico" onClick={() => setSelectorAbierto(true)}>
            <Icono nombre="mas" tamano={16} /> Agregar ejercicio
          </button>
        </div>

        {dia.ejercicios.length === 0 ? (
          <p className="editor__vacio texto-suave">Este día todavía no tiene ejercicios.</p>
        ) : (
          <ol className="editor__lista">
            {dia.ejercicios.map((ej, i) => (
              <FilaEjercicio
                key={ej.uid}
                numero={i + 1}
                item={ej}
                esPrimero={i === 0}
                esUltimo={i === dia.ejercicios.length - 1}
                onCambiar={(campo, valor) => cambiarEjercicio(ej.uid, campo, valor)}
                onQuitar={() => quitarEjercicio(ej.uid)}
                onMover={(dir) => moverEjercicio(i, dir)}
              />
            ))}
          </ol>
        )}

        <button type="button" className="editor__agregar" onClick={() => setSelectorAbierto(true)}>
          <span className="editor__agregar-icono">
            <Icono nombre="mas" tamano={18} />
          </span>
          <span>
            <strong>Agregar ejercicio</strong>
            <small>Buscá en la biblioteca de ejercicios</small>
          </span>
          <Icono nombre="chevron" tamano={18} />
        </button>
      </section>

      {/* ---------- Acciones ---------- */}
      <div className="editor__acciones">
        {!esNueva && (
          <button type="button" className="boton boton--peligro" onClick={handleEliminar}>
            <Icono nombre="basura" tamano={18} /> Eliminar rutina
          </button>
        )}
        <button type="button" className="boton boton--secundario" onClick={onVolver}>
          Cancelar
        </button>
        <button type="button" className="boton" onClick={handleGuardar}>
          Guardar rutina
        </button>
      </div>

      {selectorAbierto && (
        <SelectorEjercicio onElegir={agregarEjercicio} onCerrar={() => setSelectorAbierto(false)} />
      )}
    </div>
  )
}

export default EditorRutina
