// /api/entrenamientos: historial de entrenamientos terminados
import { Router } from 'express'
import { prisma } from '../prisma.js'
import { exigir, noEncontrado } from '../errores.js'
import { validarEntrenamiento } from '../validacion.js'
import { aEntrenamiento, datosEntrenamiento } from '../mapeos.js'

const router = Router()

// GET /api/entrenamientos  -> del más viejo al más nuevo
router.get('/', async (req, res) => {
  const lista = await prisma.entrenamiento.findMany({ where: { usuarioId: req.usuarioId }, orderBy: { inicio: 'asc' } })
  res.json(lista.map(aEntrenamiento))
})

// POST /api/entrenamientos  -> guarda un entrenamiento terminado
router.post('/', async (req, res) => {
  const creado = await prisma.entrenamiento.create({
    data: datosEntrenamiento(req.usuarioId, validarEntrenamiento(req.body)),
  })
  res.status(201).json(aEntrenamiento(creado))
})

// POST /api/entrenamientos/lote  [ ... ]  -> guarda varios (se usa para los datos de ejemplo)
router.post('/lote', async (req, res) => {
  exigir(Array.isArray(req.body) && req.body.length <= 1000, 'Se esperaba una lista de hasta 1000 entrenamientos.')
  const datos = req.body.map((e) => datosEntrenamiento(req.usuarioId, validarEntrenamiento(e)))
  const creados = await prisma.entrenamiento.createManyAndReturn({ data: datos })
  res.status(201).json(creados.map(aEntrenamiento).sort((a, b) => a.inicio - b.inicio))
})

// DELETE /api/entrenamientos/demo  -> borra solo los datos de ejemplo
router.delete('/demo', async (req, res) => {
  await prisma.entrenamiento.deleteMany({ where: { usuarioId: req.usuarioId, demo: true } })
  res.status(204).end()
})

// DELETE /api/entrenamientos/:id
router.delete('/:id', async (req, res) => {
  const { count } = await prisma.entrenamiento.deleteMany({
    where: { id: Number(req.params.id) || 0, usuarioId: req.usuarioId },
  })
  if (count === 0) throw noEncontrado('Entrenamiento')
  res.status(204).end()
})

export default router
