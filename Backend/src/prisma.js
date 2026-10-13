// Cliente de Prisma: una sola instancia para toda la app.
// (En Vercel la función se reutiliza entre peticiones, así no se abren conexiones de más.)
import './config.js' // carga el .env antes de crear el cliente
import { PrismaClient } from '@prisma/client'

const global = globalThis
export const prisma = global.__prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma
