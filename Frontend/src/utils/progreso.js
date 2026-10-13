// Cálculos para la página Progreso, a partir del historial de entrenamientos
import { inicioDeSemana, indiceDia } from './estadisticas'

const DIA_MS = 24 * 60 * 60 * 1000

export const PERIODOS = [
  { id: '4s', texto: '4 semanas', dias: 28 },
  { id: '3m', texto: '3 meses', dias: 91 },
  { id: '1a', texto: '1 año', dias: 365 },
  { id: 'todo', texto: 'Todo', dias: null },
]

// Sesiones dentro del período y las del período anterior (para comparar)
export function filtrarPeriodo(historial, dias) {
  if (!dias) return { actual: historial, anterior: null }
  const ahora = Date.now()
  const desde = ahora - dias * DIA_MS
  return {
    actual: historial.filter((s) => s.inicio >= desde),
    anterior: historial.filter((s) => s.inicio >= desde - dias * DIA_MS && s.inicio < desde),
  }
}

// 1RM estimado (fórmula de Epley)
export function unoRM(peso, reps) {
  return reps <= 1 ? peso : peso * (1 + reps / 30)
}

// ¿La serie a es mejor que la b? Más peso, o mismo peso con más repeticiones
function esMejor(a, b) {
  return !b || a.peso > b.peso || (a.peso === b.peso && a.reps > b.reps)
}

/**
 * Recorre el historial en orden y detecta los récords personales.
 * La primera vez que se hace un ejercicio no cuenta como récord (es la marca inicial).
 * Devuelve:
 *  - mejores: { [ejercicioId]: { peso, reps, fecha } }  mejor serie de siempre
 *  - recordsPorSesion: { [sesionId]: [ejercicioId, ...] }
 *  - records: [{ ejercicioId, peso, reps, fecha }]  cada vez que se rompió un récord
 */
export function analizarRecords(historial) {
  const mejores = {}
  const recordsPorSesion = {}
  const records = []

  for (const sesion of historial) {
    for (const ej of sesion.ejercicios) {
      const mejorSesion = ej.series.reduce((m, s) => (esMejor(s, m) ? s : m), null)
      if (!mejorSesion) continue
      const previo = mejores[ej.ejercicioId]
      if (esMejor(mejorSesion, previo)) {
        mejores[ej.ejercicioId] = { ...mejorSesion, fecha: sesion.inicio }
        if (previo) {
          records.push({ ejercicioId: ej.ejercicioId, ...mejorSesion, fecha: sesion.inicio })
          ;(recordsPorSesion[sesion.id] ??= []).push(ej.ejercicioId)
        }
      }
    }
  }
  return { mejores, recordsPorSesion, records }
}

/**
 * Puntos para el gráfico de un ejercicio: uno por entrenamiento.
 * metrica: 'peso' | 'rm' | 'volumen'
 */
export function serieEjercicio(sesiones, ejercicioId, metrica, recordsPorSesion) {
  const puntos = []
  for (const s of sesiones) {
    const ej = s.ejercicios.find((e) => e.ejercicioId === ejercicioId)
    if (!ej || ej.series.length === 0) continue

    const mejor = ej.series.reduce((m, x) => (esMejor(x, m) ? x : m), null)
    let valor
    if (metrica === 'peso') valor = mejor.peso
    else if (metrica === 'rm') valor = Math.max(...ej.series.map((x) => unoRM(x.peso, x.reps)))
    else valor = ej.series.reduce((t, x) => t + x.peso * x.reps, 0)

    puntos.push({
      fecha: s.inicio,
      valor: Math.round(valor * 10) / 10,
      mejor,
      record: (recordsPorSesion[s.id] ?? []).includes(ejercicioId),
    })
  }
  return puntos
}

// Ejercicios que aparecen en el historial, del más reciente al más viejo
export function ejerciciosHechos(historial) {
  const vistos = []
  for (let i = historial.length - 1; i >= 0; i--) {
    for (const e of historial[i].ejercicios) {
      if (!vistos.includes(e.ejercicioId)) vistos.push(e.ejercicioId)
    }
  }
  return vistos
}

/**
 * Datos para el calendario de constancia: matriz [día 0-6][semana] con el volumen de ese día.
 * La última columna es la semana actual.
 */
export function calendarioConstancia(historial, semanas = 12) {
  const lunesActual = inicioDeSemana()
  const desde = lunesActual - (semanas - 1) * 7 * DIA_MS
  const celdas = Array.from({ length: 7 }, () => Array(semanas).fill(0))

  for (const s of historial) {
    if (s.inicio < desde) continue
    const semana = Math.floor((inicioDeSemana(new Date(s.inicio)) - desde) / (7 * DIA_MS))
    if (semana >= 0 && semana < semanas) celdas[indiceDia(s.inicio)][semana] += s.volumen || 1
  }

  const max = Math.max(0, ...celdas.flat())
  return { celdas, max, desde }
}

// Promedio de entrenos por semana y los días de la semana en que más se entrena
export function habitos(historial, semanas = 12) {
  const desde = inicioDeSemana() - (semanas - 1) * 7 * DIA_MS
  const sesiones = historial.filter((s) => s.inicio >= desde)
  if (sesiones.length === 0) return { porSemana: 0, diasFuertes: [] }

  // si empezó hace menos de 12 semanas, se promedia solo desde la primera
  const primera = Math.max(desde, inicioDeSemana(new Date(sesiones[0].inicio)))
  const semanasReales = Math.max(1, Math.ceil((Date.now() - primera) / (7 * DIA_MS)))

  const conteo = Array(7).fill(0)
  sesiones.forEach((s) => conteo[indiceDia(s.inicio)]++)
  const NOMBRES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const diasFuertes = conteo
    .map((c, i) => ({ c, i }))
    .filter((d) => d.c > 0)
    .sort((a, b) => b.c - a.c)
    .slice(0, 3)
    .sort((a, b) => a.i - b.i)
    .map((d) => NOMBRES[d.i])

  return { porSemana: Math.round((sesiones.length / semanasReales) * 10) / 10, diasFuertes }
}

// Series hechas por grupo muscular (una serie cuenta para cada músculo del ejercicio)
export function seriesPorMusculo(sesiones, buscarEjercicio) {
  const conteo = {}
  for (const s of sesiones) {
    for (const e of s.ejercicios) {
      const info = buscarEjercicio(e.ejercicioId)
      info?.musculos.forEach((m) => (conteo[m] = (conteo[m] ?? 0) + e.series.length))
    }
  }
  return conteo
}

export function formatearDuracion(seg) {
  const h = Math.floor(seg / 3600)
  const m = Math.round((seg % 3600) / 60)
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`
}

export function formatearKg(kg) {
  return `${Math.round(kg).toLocaleString('es-AR')} kg`
}

export function fechaCorta(ms) {
  return new Date(ms).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')
}

/**
 * Semanas para la tarjeta de Constancia, de la más nueva a la más vieja.
 * [{ inicio, dias: [bool x7], cantidad, cumplida, actual }]
 */
export function semanasConstancia(historial, meta, semanas = 8) {
  const lunesActual = inicioDeSemana()
  return Array.from({ length: semanas }, (_, k) => {
    const inicio = lunesActual - k * 7 * DIA_MS
    const fin = inicio + 7 * DIA_MS
    const sesiones = historial.filter((s) => s.inicio >= inicio && s.inicio < fin)
    const dias = Array(7).fill(false)
    sesiones.forEach((s) => (dias[indiceDia(s.inicio)] = true))
    return { inicio, dias, cantidad: sesiones.length, cumplida: sesiones.length >= meta, actual: k === 0 }
  })
}
