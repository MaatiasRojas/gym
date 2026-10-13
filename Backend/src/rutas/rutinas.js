// /api/rutinas: rutinas del usuario
import { Router } from 'express'
import { prisma } from '../prisma.js'
import { noEncontrado } from '../errores.js'
import { validarRutina } from '../validacion.js'
import { crearRutina } from '../servicios/datosUsuario.js'
import { aRutina } from '../mapeos.js'

const router = Router()

async function buscar(id, usuarioId) {
  const rutina = await prisma.rutina.findFirst({ where: { id: Number(id) || 0, usuarioId } })
  if (!rutina) throw noEncontrado('Rutina')
  return rutina
}

// GET /api/rutinas
router.get('/', async (req, res) => {
  const lista = await prisma.rutina.findMany({ where: { usuarioId: req.usuarioId }, orderBy: { id: 'asc' } })
  res.json(lista.map(aRutina))
})

// POST /api/rutinas
router.post('/', async (req, res) => {
  const creada = await crearRutina(req.usuarioId, validarRutina(req.body))
  res.status(201).json(aRutina(creada))
})

// PUT /api/rutinas/:id
router.put('/:id', async (req, res) => {
  const actual = await buscar(req.params.id, req.usuarioId)
  const actualizada = await prisma.rutina.update({ where: { id: actual.id }, data: validarRutina(req.body) })
  res.json(aRutina(actualizada))
})

// DELETE /api/rutinas/:id  (el historial de esa rutina se conserva)
router.delete('/:id', async (req, res) => {
  const actual = await buscar(req.params.id, req.usuarioId)
  await prisma.rutina.delete({ where: { id: actual.id } })
  res.status(204).end()
})

export default router
