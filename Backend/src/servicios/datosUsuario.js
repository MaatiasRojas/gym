// Operaciones sobre todos los datos de un usuario: crear los iniciales, importar, borrar.
// Las funciones reciben `db`: puede ser `prisma` o el cliente de una transacción (`tx`).
import { prisma } from '../prisma.js'
import { EJERCICIOS_BASE, RUTINA_EJEMPLO } from '../datos/semilla.js'
import { validarEjercicio, validarRutina, validarEntrenamiento, validarAjustes } from '../validacion.js'
import { datosEntrenamiento } from '../mapeos.js'

export const AJUSTES_POR_DEFECTO = {
  nombre: '',
  apellido: '',
  objetivoTitulo: 'Mejorar mi físico',
  objetivoDescripcion: 'Mantener una rutina constante de 4 entrenamientos por semana.',
  metaSemanal: 4,
  sonido: true,
  vibracion: true,
  pantallaEncendida: true,
}

// Las transacciones largas (importar una copia) necesitan más tiempo que el de por defecto (5 s)
export const OPCIONES_TRANSACCION = { maxWait: 10_000, timeout: 60_000 }

// ---------- Ajustes ----------

export async function ajustesCompletos(usuarioId, db = prisma) {
  const usuario = await db.usuario.findUnique({ where: { id: usuarioId }, select: { ajustes: true } })
  return { ...AJUSTES_POR_DEFECTO, ...(usuario?.ajustes ?? {}) }
}

export async function guardarAjustes(usuarioId, ajustes, db = prisma) {
  await db.usuario.update({ where: { id: usuarioId }, data: { ajustes } })
}

// ---------- Inserciones ----------

export async function crearEjercicio(usuarioId, e, personalizado, db = prisma) {
  return db.ejercicio.create({ data: { ...e, usuarioId, personalizado: Boolean(personalizado) } })
}

export async function crearRutina(usuarioId, r, db = prisma) {
  return db.rutina.create({ data: { ...r, usuarioId } })
}

// Cambia los ejercicioId de una rutina usando el mapa idViejo -> idNuevo
function remapearRutina(rutina, mapa) {
  return {
    ...rutina,
    dias: rutina.dias.map((d) => ({
      ...d,
      ejercicios: d.ejercicios
        .filter((e) => mapa.has(e.ejercicioId))
        .map((e) => ({ ...e, ejercicioId: mapa.get(e.ejercicioId) })),
    })),
  }
}

// Inserta ejercicios uno por uno (para saber el id nuevo de cada uno) y devuelve el mapa idViejo -> idNuevo
async function crearEjerciciosConMapa(usuarioId, lista, db, personalizadoPorDefecto) {
  const mapa = new Map()
  for (const e of lista) {
    const creado = await crearEjercicio(usuarioId, validarEjercicio(e), e.personalizado ?? personalizadoPorDefecto, db)
    mapa.set(e.id, creado.id)
  }
  return mapa
}

// ---------- Datos iniciales de un usuario nuevo ----------

export async function sembrarUsuario(usuarioId, nombre, db = prisma) {
  await guardarAjustes(usuarioId, { ...AJUSTES_POR_DEFECTO, nombre }, db)

  // Los 17 ejercicios base en una sola consulta (los nombres son únicos, así que se relacionan por nombre)
  const creados = await db.ejercicio.createManyAndReturn({
    data: EJERCICIOS_BASE.map((e) => ({ ...validarEjercicio(e), usuarioId, personalizado: false })),
    select: { id: true, nombre: true },
  })
  const idPorNombre = new Map(creados.map((e) => [e.nombre, e.id]))
  const mapa = new Map(EJERCICIOS_BASE.map((e) => [e.id, idPorNombre.get(e.nombre)]))

  await crearRutina(usuarioId, validarRutina(remapearRutina(RUTINA_EJEMPLO, mapa)), db)
}

// ---------- Borrar todo (menos la cuenta) ----------

export async function borrarDatos(usuarioId, db = prisma) {
  await db.entrenamiento.deleteMany({ where: { usuarioId } })
  await db.rutina.deleteMany({ where: { usuarioId } })
  await db.ejercicio.deleteMany({ where: { usuarioId } })
}

// ---------- Importar una copia de seguridad ----------
// Acepta la copia del backend (version 2) y la que generaba la app cuando guardaba
// todo en el navegador (version 1, con "historial" en vez de "entrenamientos").

export async function importarDatos(usuarioId, datos, db) {
  // Se valida todo antes de borrar nada
  const entrenamientosOriginales = datos.entrenamientos ?? datos.historial ?? []
  const ajustesNuevos = datos.ajustes ? validarAjustes(datos.ajustes) : null

  await borrarDatos(usuarioId, db)

  if (ajustesNuevos) {
    await guardarAjustes(usuarioId, { ...(await ajustesCompletos(usuarioId, db)), ...ajustesNuevos }, db)
  }

  const mapaEjercicios = await crearEjerciciosConMapa(usuarioId, datos.ejercicios ?? [], db, false)

  const mapaRutinas = new Map()
  for (const r of datos.rutinas ?? []) {
    const creada = await crearRutina(usuarioId, validarRutina(remapearRutina(r, mapaEjercicios)), db)
    mapaRutinas.set(r.id, creada.id)
  }

  const entrenamientos = entrenamientosOriginales.map((e) =>
    datosEntrenamiento(
      usuarioId,
      validarEntrenamiento({
        ...e,
        rutinaId: mapaRutinas.get(e.rutinaId) ?? null,
        ejercicios: (e.ejercicios ?? [])
          .filter((x) => mapaEjercicios.has(x.ejercicioId))
          .map((x) => ({ ...x, ejercicioId: mapaEjercicios.get(x.ejercicioId) })),
      })
    )
  )
  if (entrenamientos.length) await db.entrenamiento.createMany({ data: entrenamientos })

  return { ejercicios: mapaEjercicios.size, rutinas: mapaRutinas.size, entrenamientos: entrenamientos.length }
}
