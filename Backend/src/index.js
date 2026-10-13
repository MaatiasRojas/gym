// Servidor de GymTrack
import express from 'express'
import { config, enVercel } from './config.js'
import { ErrorApi } from './errores.js'
import { requiereSesion } from './seguridad.js'
import rutasAuth from './rutas/auth.js'
import rutasAjustes from './rutas/ajustes.js'
import rutasEjercicios from './rutas/ejercicios.js'
import rutasRutinas from './rutas/rutinas.js'
import rutasEntrenamientos from './rutas/entrenamientos.js'
import rutasDatos from './rutas/datos.js'

const app = express()

// Permite llamar a la API desde otro origen (por ejemplo el frontend en otro puerto)
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', req.get('origin') ?? '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(204).end()
  next()
})

// JSON de hasta 4,5 MB (el máximo que acepta Vercel por petición)
app.use(express.json({ limit: '4.5mb' }))

// ---------- Rutas ----------
app.get('/api/salud', (req, res) => res.json({ ok: true }))
app.use('/api/auth', rutasAuth)

// A partir de acá, todas las rutas necesitan sesión iniciada
app.use('/api/ajustes', requiereSesion, rutasAjustes)
app.use('/api/ejercicios', requiereSesion, rutasEjercicios)
app.use('/api/rutinas', requiereSesion, rutasRutinas)
app.use('/api/entrenamientos', requiereSesion, rutasEntrenamientos)
app.use('/api/datos', requiereSesion, rutasDatos)

app.use('/api', (req, res) => {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` })
})

// ---------- Manejo de errores ----------
// Express 5 manda acá también los errores de las funciones async
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ErrorApi) {
    return res.status(err.status).json({ error: err.message })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Los datos son demasiado grandes (máx. 4,5 MB).' })
  }
  // Prisma: violación de un valor único (por ejemplo, dos registros con el mismo email a la vez)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ese dato ya existe.' })
  }
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

// En Vercel la app se exporta y Vercel la ejecuta como función.
// En tu compu se levanta un servidor normal.
if (!enVercel) {
  app.listen(config.puerto, () => {
    console.log(`✔ GymTrack API escuchando en http://localhost:${config.puerto}/api`)
  })
}

export default app
