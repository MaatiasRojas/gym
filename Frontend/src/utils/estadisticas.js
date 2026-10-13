// Cálculos a partir del historial de entrenamientos

const DIA_MS = 24 * 60 * 60 * 1000

// Lunes 00:00 de la semana de la fecha dada
export function inicioDeSemana(fecha = new Date()) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

// 0 = Lunes ... 6 = Domingo
export function indiceDia(fecha) {
  return (new Date(fecha).getDay() + 6) % 7
}

export function esHoy(fecha) {
  return new Date(fecha).toDateString() === new Date().toDateString()
}

/**
 * Resumen de la semana actual:
 * { entrenamientos, tiempoHoras, volumenKg, racha, dias: [bool x7] }
 * racha = semanas seguidas cumpliendo la meta semanal
 */
export function resumenSemanal(historial, metaSemanal) {
  const lunes = inicioDeSemana()
  const sesiones = historial.filter((s) => s.inicio >= lunes)

  const dias = Array(7).fill(false)
  sesiones.forEach((s) => (dias[indiceDia(s.inicio)] = true))

  const segundos = sesiones.reduce((t, s) => t + s.duracionSeg, 0)
  const volumenKg = sesiones.reduce((t, s) => t + s.volumen, 0)

  // Racha: si esta semana ya se cumplió cuenta; si no, se arranca desde la semana pasada
  const contarSemana = (desde) =>
    historial.filter((s) => s.inicio >= desde && s.inicio < desde + 7 * DIA_MS).length
  let racha = 0
  let semana = sesiones.length >= metaSemanal ? lunes : lunes - 7 * DIA_MS
  while (contarSemana(semana) >= metaSemanal) {
    racha++
    semana -= 7 * DIA_MS
  }

  return {
    entrenamientos: sesiones.length,
    tiempoHoras: Math.round((segundos / 3600) * 10) / 10,
    volumenKg,
    racha,
    dias,
  }
}

/**
 * Sugiere qué entrenar: la rutina usada por última vez y el día siguiente al último que se hizo.
 * Devuelve { rutina, diaIndice } o null si no hay rutinas.
 */
export function sugerirSiguiente(rutinas, historial) {
  if (rutinas.length === 0) return null

  for (let i = historial.length - 1; i >= 0; i--) {
    const rutina = rutinas.find((r) => r.id === historial[i].rutinaId)
    if (rutina) {
      return { rutina, diaIndice: (historial[i].diaIndice + 1) % rutina.dias.length }
    }
  }
  return { rutina: rutinas[0], diaIndice: 0 }
}
