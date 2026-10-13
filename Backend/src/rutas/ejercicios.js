// /api/ejercicios: biblioteca de ejercicios del usuario
import { Router } from 'express'
import { prisma } from '../prisma.js'
import { noEncontrado } from '../errores.js'
import { validarEjercicio } from '../validacion.js'
import { crearEjercicio } from '../servicios/datosUsuario.js'
import { aEjercicio } from '../mapeos.js'

const router = Router()

// Busca un ejercicio del usuario o tira 404 (así nadie toca ejercicios ajenos)
async function buscar(id, usuarioId) {
  const ejercicio = await prisma.ejercicio.findFirst({ where: { id: Number(id) || 0, usuarioId } })
  if (!ejercicio) throw noEncontrado('Ejercicio')
  return ejercicio
}

// GET /api/ejercicios
router.get('/', async (req, res) => {
  const lista = await prisma.ejercicio.findMany({ where: { usuarioId: req.usuarioId }, orderBy: { nombre: 'asc' } })
  res.json(lista.map(aEjercicio))
})

// POST /api/ejercicios  -> crea un ejercicio propio
router.post('/', async (req, res) => {
  const creado = await crearEjercicio(req.usuarioId, validarEjercicio(req.body), true)
  res.status(201).json(aEjercicio(creado))
})

// PUT /api/ejercicios/:id
router.put('/:id', async (req, res) => {
  const actual = await buscar(req.params.id, req.usuarioId)
  const actualizado = await prisma.ejercicio.update({ where: { id: actual.id }, data: validarEjercicio(req.body) })
  res.json(aEjercicio(actualizado))
})

// DELETE /api/ejercicios/:id
// Las rutinas y el historial que lo usan lo muestran como "Ejercicio eliminado"
router.delete('/:id', async (req, res) => {
  const actual = await buscar(req.params.id, req.usuarioId)
  await prisma.ejercicio.delete({ where: { id: actual.id } })
  res.status(204).end()
})

export default router
