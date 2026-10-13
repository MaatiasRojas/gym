// Configuración leída de las variables de entorno.
// En tu compu salen del archivo .env; en Vercel, de Settings → Environment Variables.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

// Carga el archivo .env si existe (función incluida en Node, no hace falta dotenv)
try {
  process.loadEnvFile()
} catch {
  // no hay .env: se usan las variables del sistema (por ejemplo, en Vercel)
}

export const enVercel = Boolean(process.env.VERCEL)

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL. Copiá .env.example como .env y poné la conexión de Neon.')
}

// Clave para firmar las sesiones.
// En Vercel tiene que estar en las variables de entorno (el disco es de solo lectura).
// En tu compu, si no está en el .env, se genera una y se guarda en .secreto para no perder las sesiones.
function obtenerSecreto() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (enVercel) {
    throw new Error('Falta la variable JWT_SECRET en Vercel (Settings → Environment Variables).')
  }
  const archivo = '.secreto'
  if (existsSync(archivo)) return readFileSync(archivo, 'utf8').trim()
  const secreto = randomBytes(32).toString('hex')
  writeFileSync(archivo, secreto)
  console.log('ℹ  No hay JWT_SECRET en el .env: se generó uno en el archivo .secreto')
  return secreto
}

export const config = {
  puerto: Number(process.env.PORT) || 3001,
  jwtSecret: obtenerSecreto(),
  sesionDias: Number(process.env.SESION_DIAS) || 30,
}
