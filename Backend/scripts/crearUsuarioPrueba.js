// Crea un usuario de prueba con ~12 semanas de entrenamientos de ejemplo.
//
//   npm run usuario-prueba            -> lo crea (si ya existe, no hace nada)
//   npm run usuario-prueba -- --reset -> lo borra y lo vuelve a crear
//
// Usa la base del DATABASE_URL del .env (o sea, Neon).
import { prisma } from '../src/prisma.js'
import { hashearPassword } from '../src/seguridad.js'
import { sembrarUsuario, guardarAjustes, ajustesCompletos, OPCIONES_TRANSACCION } from '../src/servicios/datosUsuario.js'
import { validarEntrenamiento } from '../src/validacion.js'
import { aRutina, datosEntrenamiento } from '../src/mapeos.js'

const EMAIL = 'prueba@gymtrack.com'
const PASSWORD = 'prueba123'
const NOMBRE = 'Matias'
const APELLIDO = 'Prueba'
const SEMANAS = 12

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
  'Curl de bíceps con barra': 25,
  Sentadilla: 70,
  'Peso muerto rumano': 60,
  'Prensa de piernas': 120,
  'Hip thrust': 60,
}

// Números pseudoaleatorios repetibles: los datos salen siempre iguales
function aleatorio(semilla) {
  let s = semilla
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const redondear = (kg) => Math.round(kg / 2.5) * 2.5

// Lunes, miércoles y viernes (a veces sábado), con alguna falta, rotando los días de la rutina
function generarHistorial(rutina, nombreDe) {
  const azar = aleatorio(7)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const historial = []
  let vuelta = 0

  for (let d = SEMANAS * 7; d >= 1; d--) {
    const fecha = new Date(hoy.getTime() - d * DIA_MS)
    const diaSemana = (fecha.getDay() + 6) % 7
    const toca = [0, 2, 4].includes(diaSemana) || (diaSemana === 5 && azar() < 0.3)
    if (!toca || azar() < 0.12) continue

    const diaIndice = vuelta % rutina.dias.length
    const dia = rutina.dias[diaIndice]
    vuelta++
    const semanasHechas = (SEMANAS * 7 - d) / 7

    const ejercicios = dia.ejercicios.map((e) => {
      const base = PESO_BASE[nombreDe(e.ejercicioId)] ?? 20
      const peso = base === 0 ? 0 : redondear(base * (1 + semanasHechas * 0.018) + (azar() - 0.5) * 2.5)
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
    historial.push({
      inicio,
      fin: inicio + duracionSeg * 1000,
      duracionSeg,
      rutinaId: rutina.id,
      rutinaNombre: rutina.nombre,
      diaIndice,
      diaNombre: dia.nombre,
      ejercicios,
      demo: true, // se pueden borrar desde Ajustes > "Borrar datos de ejemplo"
    })
  }
  return historial
}

async function main() {
  const reset = process.argv.includes('--reset')
  const existente = await prisma.usuario.findUnique({ where: { email: EMAIL } })

  if (existente && !reset) {
    console.log(`El usuario ${EMAIL} ya existe. Usá "npm run usuario-prueba -- --reset" para recrearlo.`)
    return
  }

  const cantidad = await prisma.$transaction(async (tx) => {
    if (existente) await tx.usuario.delete({ where: { id: existente.id } }) // borra todo en cascada

    const usuario = await tx.usuario.create({ data: { email: EMAIL, passwordHash: hashearPassword(PASSWORD) } })
    await sembrarUsuario(usuario.id, NOMBRE, tx)
    await guardarAjustes(usuario.id, { ...(await ajustesCompletos(usuario.id, tx)), apellido: APELLIDO }, tx)

    const ejercicios = await tx.ejercicio.findMany({ where: { usuarioId: usuario.id } })
    const rutina = aRutina(await tx.rutina.findFirst({ where: { usuarioId: usuario.id }, orderBy: { id: 'asc' } }))
    const nombreDe = (id) => ejercicios.find((e) => e.id === id)?.nombre

    const historial = generarHistorial(rutina, nombreDe)
    await tx.entrenamiento.createMany({
      data: historial.map((e) => datosEntrenamiento(usuario.id, validarEntrenamiento(e))),
    })
    return historial.length
  }, OPCIONES_TRANSACCION)

  console.log(`✔ Usuario de prueba ${existente ? 'recreado' : 'creado'}
   Email:       ${EMAIL}
   Contraseña:  ${PASSWORD}
   Entrenamientos de ejemplo: ${cantidad} (últimas ${SEMANAS} semanas)`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
