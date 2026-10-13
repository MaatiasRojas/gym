// /api/auth: registro, inicio de sesión y datos del usuario actual
import { Router } from 'express'
import { prisma } from '../prisma.js'
import { ErrorApi } from '../errores.js'
import { hashearPassword, verificarPassword, crearToken, requiereSesion } from '../seguridad.js'
import { validarCredenciales } from '../validacion.js'
import { sembrarUsuario, OPCIONES_TRANSACCION } from '../servicios/datosUsuario.js'

const router = Router()

// POST /api/auth/registro  { nombre, email, password }
router.post('/registro', async (req, res) => {
  const { nombre, email, password } = validarCredenciales(req.body, true)

  const existe = await prisma.usuario.findUnique({ where: { email } })
  if (existe) throw new ErrorApi(409, 'Ya existe una cuenta con ese email.')

  const usuario = await prisma.$transaction(async (tx) => {
    const creado = await tx.usuario.create({ data: { email, passwordHash: hashearPassword(password) } })
    await sembrarUsuario(creado.id, nombre, tx) // ajustes, ejercicios base y una rutina de ejemplo
    return creado
  }, OPCIONES_TRANSACCION)

  res.status(201).json({ token: crearToken(usuario.id), usuario: { id: usuario.id, email } })
})

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = validarCredenciales(req.body)
  const usuario = await prisma.usuario.findUnique({ where: { email } })

  // Mismo mensaje si no existe el email o si la contraseña está mal
  if (!usuario || !verificarPassword(password, usuario.passwordHash)) {
    throw new ErrorApi(401, 'Email o contraseña incorrectos.')
  }

  res.json({ token: crearToken(usuario.id), usuario: { id: usuario.id, email: usuario.email } })
})

// GET /api/auth/yo  -> usuario de la sesión actual
router.get('/yo', requiereSesion, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuarioId },
    select: { id: true, email: true },
  })
  if (!usuario) throw new ErrorApi(401, 'Tu sesión venció. Volvé a iniciar sesión.')
  res.json({ usuario })
})

export default router
