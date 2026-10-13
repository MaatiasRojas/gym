// /api/datos: copia de seguridad, restaurar y borrar todo
import { Router } from 'express'
import { prisma } from '../prisma.js'
import { exigir } from '../errores.js'
import { aEjercicio, aRutina, aEntrenamiento } from '../mapeos.js'
import {
  ajustesCompletos,
  borrarDatos,
  guardarAjustes,
  importarDatos,
  sembrarUsuario,
  OPCIONES_TRANSACCION,
} from '../servicios/datosUsuario.js'

const router = Router()

// GET /api/datos  -> copia de seguridad con todo
router.get('/', async (req, res) => {
  const usuarioId = req.usuarioId
  const [ajustes, ejercicios, rutinas, entrenamientos] = await Promise.all([
    ajustesCompletos(usuarioId),
    prisma.ejercicio.findMany({ where: { usuarioId }, orderBy: { id: 'asc' } }),
    prisma.rutina.findMany({ where: { usuarioId }, orderBy: { id: 'asc' } }),
    prisma.entrenamiento.findMany({ where: { usuarioId }, orderBy: { inicio: 'asc' } }),
  ])
  res.json({
    app: 'GymTrack',
    version: 2,
    fecha: new Date().toISOString(),
    datos: {
      ajustes,
      ejercicios: ejercicios.map(aEjercicio),
      rutinas: rutinas.map(aRutina),
      entrenamientos: entrenamientos.map(aEntrenamiento),
    },
  })
})

// POST /api/datos/restaurar  { app: 'GymTrack', datos: {...} }  -> reemplaza todo
router.post('/restaurar', async (req, res) => {
  const copia = req.body
  exigir(
    copia?.app === 'GymTrack' && copia.datos && typeof copia.datos === 'object',
    'El archivo no es una copia de GymTrack válida.'
  )
  const resumen = await prisma.$transaction((tx) => importarDatos(req.usuarioId, copia.datos, tx), OPCIONES_TRANSACCION)
  res.json({ ok: true, ...resumen })
})

// DELETE /api/datos  -> deja la cuenta como recién creada (conserva nombre y apellido)
router.delete('/', async (req, res) => {
  const { nombre, apellido } = await ajustesCompletos(req.usuarioId)
  await prisma.$transaction(async (tx) => {
    await borrarDatos(req.usuarioId, tx)
    await sembrarUsuario(req.usuarioId, nombre, tx)
    await guardarAjustes(req.usuarioId, { ...(await ajustesCompletos(req.usuarioId, tx)), apellido }, tx)
  }, OPCIONES_TRANSACCION)
  res.status(204).end()
})

export default router
