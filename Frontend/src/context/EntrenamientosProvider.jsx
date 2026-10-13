import { useEffect, useRef } from 'react'
import { EntrenamientosContext } from './entrenamientosContext'
import { useAuth } from './authContext'
import { usePersistente } from '../hooks/usePersistente'
import { useCarga } from '../hooks/useCarga'
import { api } from '../api/cliente'
import Cargando from '../components/layout/Cargando'

const REINTENTO_MS = 60 * 1000

/**
 * Maneja el entrenamiento en curso y el historial de entrenamientos.
 *
 * - historial: viene del backend (del más viejo al más nuevo).
 * - sesionActiva: el entreno en curso. Se guarda en el teléfono (localStorage) para no
 *   perderlo si se recarga la página; recién al finalizar se manda al backend.
 * - pendientes: entrenos terminados que todavía no se pudieron mandar (por ejemplo, sin
 *   señal en el gimnasio). Se reintentan solos y mientras tanto se ven en el historial.
 *
 * sesionActiva:
 * { id, usuarioId, inicio (ms), rutinaId, rutinaNombre, diaIndice, diaNombre,
 *   ejercicios: [{ uid, ejercicioId, descanso, repsObjetivo, series: [{ peso: '', reps: '', hecha: false }] }] }
 *
 * cada entrenamiento del historial:
 * { id, inicio, fin, duracionSeg, rutinaId, rutinaNombre, diaIndice, diaNombre, volumen, demo,
 *   ejercicios: [{ ejercicioId, series: [{ peso, reps }] }] }   // solo series hechas
 */
function EntrenamientosProvider({ children }) {
  const { usuario } = useAuth()
  const { datos: guardados, setDatos, estado, error, recargar } = useCarga('/entrenamientos')
  const [sesionGuardada, setSesionActiva] = usePersistente('sesionActiva', null)
  const [todosPendientes, setPendientes] = usePersistente('pendientes', [])

  // Lo guardado en el teléfono pertenece a un usuario: si en el mismo celular entra otro, no lo ve
  const sesionActiva = sesionGuardada?.usuarioId === usuario.id ? sesionGuardada : null
  const pendientes = todosPendientes.filter((p) => p.usuarioId === usuario.id)

  // ---------- Envío de entrenamientos al backend (con reintentos) ----------
  const enviando = useRef(new Set())
  const pendientesRef = useRef(pendientes)
  useEffect(() => {
    pendientesRef.current = pendientes
  })

  async function enviar(registro) {
    if (enviando.current.has(registro.id)) return
    enviando.current.add(registro.id)
    try {
      const { id, usuarioId, pendiente, ...cuerpo } = registro // eslint-disable-line no-unused-vars
      const guardado = await api('/entrenamientos', { metodo: 'POST', cuerpo })
      setDatos((prev) => [...prev, guardado].sort((a, b) => a.inicio - b.inicio))
      setPendientes((prev) => prev.filter((p) => p.id !== registro.id))
    } catch {
      // queda en pendientes y se reintenta más tarde
    } finally {
      enviando.current.delete(registro.id)
    }
  }

  useEffect(() => {
    if (estado !== 'listo') return
    const reintentar = () => pendientesRef.current.forEach(enviar)
    reintentar()
    window.addEventListener('online', reintentar)
    const intervalo = setInterval(reintentar, REINTENTO_MS)
    return () => {
      window.removeEventListener('online', reintentar)
      clearInterval(intervalo)
    }
  }, [estado]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Entreno en curso ----------
  function iniciarSesion(rutina, diaIndice) {
    const dia = rutina.dias[diaIndice]
    setSesionActiva({
      id: Date.now(),
      usuarioId: usuario.id,
      inicio: Date.now(),
      rutinaId: rutina.id,
      rutinaNombre: rutina.nombre,
      diaIndice,
      diaNombre: dia.nombre || `Día ${diaIndice + 1}`,
      ejercicios: dia.ejercicios.map((e) => ({
        uid: e.uid,
        ejercicioId: e.ejercicioId,
        descanso: e.descanso,
        repsObjetivo: e.reps,
        series: Array.from({ length: e.series }, () => ({ peso: '', reps: '', hecha: false })),
      })),
    })
  }

  // Recibe una función que devuelve la sesión modificada
  function actualizarSesion(fn) {
    setSesionActiva((s) => (s ? fn(s) : s))
  }

  // Arma el registro, lo manda al backend y lo devuelve (para mostrar el resumen)
  function finalizarSesion() {
    if (!sesionActiva) return null
    const fin = Date.now()
    const ejercicios = sesionActiva.ejercicios
      .map((e) => ({
        ejercicioId: e.ejercicioId,
        series: e.series
          .filter((s) => s.hecha)
          .map((s) => ({ peso: Number(s.peso) || 0, reps: Number(s.reps) || 0 })),
      }))
      .filter((e) => e.series.length > 0)

    const volumen = ejercicios.reduce(
      (total, e) => total + e.series.reduce((t, s) => t + s.peso * s.reps, 0),
      0
    )

    const registro = {
      id: sesionActiva.id, // id temporal hasta que lo guarde el backend
      usuarioId: usuario.id,
      pendiente: true,
      inicio: sesionActiva.inicio,
      fin,
      duracionSeg: Math.round((fin - sesionActiva.inicio) / 1000),
      rutinaId: sesionActiva.rutinaId,
      rutinaNombre: sesionActiva.rutinaNombre,
      diaIndice: sesionActiva.diaIndice,
      diaNombre: sesionActiva.diaNombre,
      volumen: Math.round(volumen),
      ejercicios,
    }

    setPendientes((prev) => [...prev, registro])
    setSesionActiva(null)
    enviar(registro)
    return registro
  }

  function cancelarSesion() {
    setSesionActiva(null)
  }

  // ---------- Datos de ejemplo (para probar Progreso) ----------
  async function cargarDemo(registros) {
    try {
      const creados = await api('/entrenamientos/lote', { metodo: 'POST', cuerpo: registros })
      setDatos((prev) => [...prev, ...creados].sort((a, b) => a.inicio - b.inicio))
    } catch (err) {
      alert(`No se pudieron cargar los datos de ejemplo: ${err.message}`)
    }
  }

  async function borrarDemo() {
    setDatos((prev) => prev.filter((s) => !s.demo))
    try {
      await api('/entrenamientos/demo', { metodo: 'DELETE' })
    } catch (err) {
      alert(`No se pudieron borrar los datos de ejemplo: ${err.message}`)
      api('/entrenamientos').then(setDatos).catch(() => {})
    }
  }

  if (estado !== 'listo') return <Cargando error={error} onReintentar={recargar} />

  // Historial completo: lo del servidor + lo que todavía no se pudo mandar
  const historial = pendientes.length
    ? [...guardados, ...pendientes].sort((a, b) => a.inicio - b.inicio)
    : guardados

  // Series de la última vez que se hizo un ejercicio (o null si nunca se hizo)
  function ultimoRegistro(ejercicioId) {
    for (let i = historial.length - 1; i >= 0; i--) {
      const ej = historial[i].ejercicios.find((e) => e.ejercicioId === ejercicioId)
      if (ej) return { fecha: historial[i].inicio, series: ej.series }
    }
    return null
  }

  return (
    <EntrenamientosContext.Provider
      value={{
        historial,
        pendientes: pendientes.length,
        cargarDemo,
        borrarDemo,
        sesionActiva,
        iniciarSesion,
        actualizarSesion,
        finalizarSesion,
        cancelarSesion,
        ultimoRegistro,
      }}
    >
      {children}
    </EntrenamientosContext.Provider>
  )
}

export default EntrenamientosProvider
