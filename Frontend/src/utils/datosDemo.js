// Genera un historial de ejemplo para probar la página Progreso.
// Cada registro lleva demo: true para poder borrarlos después.

const DIA_MS = 24 * 60 * 60 * 1000

// Peso inicial aproximado por ejercicio (si no está, se usa 20 kg)
const PESO_BASE = {
  'Press de banca plano': 55,
  'Press inclinado con mancuernas': 20,
  'Aperturas en polea': 12.5,
  'Extensión de tríceps en polea': 20,
  'Extensión de tríceps por encima de la cabeza': 15,
  Dominadas: 0,
  'Remo con barra': 45,
  'Jalón al pecho': 40,
  'Curl de bíceps con barra': 25,
  'Curl martillo': 12,
  Sentadilla: 70,
  'Peso muerto rumano': 60,
  'Prensa de piernas': 120,
  'Hip thrust': 60,
  'Press militar': 30,
  'Elevaciones laterales': 7,
  Plancha: 0,
}

// Números pseudoaleatorios repetibles (así los datos son siempre los mismos)
function aleatorio(semilla) {
  let s = semilla
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const redondear = (kg) => Math.round(kg / 2.5) * 2.5

export function generarHistorialDemo(rutina, buscarEjercicio, semanas = 12) {
  if (!rutina || rutina.dias.length === 0) return []
  const azar = aleatorio(42)
  const historial = []
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  let diaRutina = 0

  for (let d = semanas * 7; d >= 1; d--) {
    const fecha = new Date(hoy.getTime() - d * DIA_MS)
    const diaSemana = (fecha.getDay() + 6) % 7
    // Entrena lunes, miércoles y viernes, a veces sábado; falta de vez en cuando
    const toca = [0, 2, 4].includes(diaSemana) || (diaSemana === 5 && azar() < 0.3)
    if (!toca || azar() < 0.12) continue

    const dia = rutina.dias[diaRutina % rutina.dias.length]
    diaRutina++
    const avance = (semanas * 7 - d) / 7 // semanas transcurridas

    const ejercicios = dia.ejercicios.map((e) => {
      const base = PESO_BASE[buscarEjercicio(e.ejercicioId)?.nombre] ?? 20
      const peso = base === 0 ? 0 : redondear(base * (1 + avance * 0.018) + (azar() - 0.5) * 2.5)
      const repsMin = parseInt(e.reps) || 8
      return {
        ejercicioId: e.ejercicioId,
        series: Array.from({ length: e.series }, (_, i) => ({
          peso,
          reps: Math.max(1, repsMin + 2 - i - Math.round(azar())),
        })),
      }
    })

    const inicio = fecha.getTime() + (18 + Math.floor(azar() * 3)) * 3600 * 1000
    const duracionSeg = Math.round((45 + azar() * 25) * 60)
    const volumen = ejercicios.reduce((t, e) => t + e.series.reduce((u, s) => u + s.peso * s.reps, 0), 0)

    historial.push({
      id: inicio,
      inicio,
      fin: inicio + duracionSeg * 1000,
      duracionSeg,
      rutinaId: rutina.id,
      rutinaNombre: rutina.nombre,
      diaIndice: rutina.dias.indexOf(dia),
      diaNombre: dia.nombre || `Día ${rutina.dias.indexOf(dia) + 1}`,
      volumen: Math.round(volumen),
      ejercicios,
      demo: true,
    })
  }
  return historial
}
