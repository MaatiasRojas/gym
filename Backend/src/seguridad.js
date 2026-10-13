// Contraseñas y tokens de sesión, usando solo el módulo crypto de Node
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'
import { config } from './config.js'
import { ErrorApi } from './errores.js'

// ---------- Contraseñas ----------
// Se guarda "scrypt$<sal>$<hash>". Nunca se guarda la contraseña en texto.

export function hashearPassword(password) {
  const sal = randomBytes(16).toString('hex')
  const hash = scryptSync(password, sal, 64).toString('hex')
  return `scrypt$${sal}$${hash}`
}

export function verificarPassword(password, guardado) {
  const [, sal, hash] = guardado.split('$')
  if (!sal || !hash) return false
  const calculado = scryptSync(password, sal, 64)
  const esperado = Buffer.from(hash, 'hex')
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado)
}

// ---------- Tokens (JWT con HS256) ----------

const base64url = (datos) => Buffer.from(datos).toString('base64url')

function firmar(contenido) {
  return createHmac('sha256', config.jwtSecret).update(contenido).digest('base64url')
}

export function crearToken(usuarioId) {
  const ahora = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({ sub: usuarioId, iat: ahora, exp: ahora + config.sesionDias * 86400 }))
  return `${header}.${payload}.${firmar(`${header}.${payload}`)}`
}

// Devuelve el id del usuario o null si el token es inválido o venció
export function leerToken(token) {
  const partes = token?.split('.')
  if (partes?.length !== 3) return null
  const [header, payload, firma] = partes

  const esperada = Buffer.from(firmar(`${header}.${payload}`))
  const recibida = Buffer.from(firma)
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null

  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!datos.exp || datos.exp < Date.now() / 1000) return null
    return datos.sub
  } catch {
    return null
  }
}

// Middleware: exige "Authorization: Bearer <token>" y deja el id en req.usuarioId
export function requiereSesion(req, res, next) {
  const encabezado = req.get('authorization') ?? ''
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null
  const usuarioId = leerToken(token)
  if (!usuarioId) throw new ErrorApi(401, 'Tu sesión venció. Volvé a iniciar sesión.')
  req.usuarioId = usuarioId
  next()
}
