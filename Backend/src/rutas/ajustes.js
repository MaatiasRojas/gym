// /api/ajustes: perfil, objetivo y preferencias del usuario
import { Router } from 'express'
import { validarAjustes } from '../validacion.js'
import { ajustesCompletos, guardarAjustes } from '../servicios/datosUsuario.js'

const router = Router()

// GET /api/ajustes
router.get('/', async (req, res) => {
  res.json(await ajustesCompletos(req.usuarioId))
})

// PUT /api/ajustes  { nombre?, metaSemanal?, sonido?, ... }  (se puede mandar solo lo que cambió)
router.put('/', async (req, res) => {
  const nuevos = { ...(await ajustesCompletos(req.usuarioId)), ...validarAjustes(req.body) }
  await guardarAjustes(req.usuarioId, nuevos)
  res.json(nuevos)
})

export default router
