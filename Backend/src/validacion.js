// Validación de los datos que manda el frontend.
// Cada función devuelve un objeto limpio o lanza un error 400 con un mensaje claro.
import { exigir } from './errores.js'

const esTexto = (v, max) => typeof v === 'string' && v.length <= max
const esEntero = (v, min, max) => Number.isInteger(v) && v >= min && v <= max
const esNumero = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
const listaDeTextos = (v, maxItems, maxLargo) =>
  Array.isArray(v) && v.length <= maxItems && v.every((x) => esTexto(x, maxLargo))

// Vercel acepta como mucho 4,5 MB por petición: la imagen (en base64) puede ocupar hasta 3 MB
const MAX_IMAGEN = 3 * 1024 * 1024

export function validarEjercicio(b) {
  exigir(b && typeof b === 'object', 'Faltan los datos del ejercicio.')
  const nombre = typeof b.nombre === 'string' ? b.nombre.trim() : ''
  exigir(nombre.length >= 1 && nombre.length <= 100, 'El nombre del ejercicio es obligatorio (máx. 100 caracteres).')
  exigir(listaDeTextos(b.musculos, 10, 30) && b.musculos.length > 0, 'Elegí al menos un músculo.')
  const descripcion = b.descripcion ?? ''
  exigir(esTexto(descripcion, 500), 'La descripción no puede superar los 500 caracteres.')
  for (const campo of ['consejos', 'errores', 'variantes']) {
    exigir(b[campo] === undefined || listaDeTextos(b[campo], 30, 300), `La lista de ${campo} no es válida.`)
  }
  const imagen = b.imagen ?? null
  exigir(
    imagen === null || (esTexto(imagen, MAX_IMAGEN) && imagen.startsWith('data:image/')),
    'La imagen no es válida o es demasiado grande.'
  )
  return {
    nombre,
    musculos: b.musculos,
    descripcion: descripcion.trim(),
    consejos: b.consejos ?? [],
    errores: b.errores ?? [],
    variantes: b.variantes ?? [],
    imagen,
  }
}

export function validarRutina(b) {
  exigir(b && typeof b === 'object', 'Faltan los datos de la rutina.')
  const nombre = typeof b.nombre === 'string' ? b.nombre.trim() : ''
  exigir(nombre.length >= 1 && nombre.length <= 100, 'Ponele un nombre a la rutina (máx. 100 caracteres).')
  exigir(esTexto(b.objetivo ?? '', 50), 'El objetivo no es válido.')
  exigir(esEntero(b.diasPorSemana, 1, 7), 'Los días por semana tienen que ser entre 1 y 7.')
  exigir(Array.isArray(b.dias) && b.dias.length >= 1 && b.dias.length <= 7, 'La rutina tiene que tener entre 1 y 7 días.')

  const dias = b.dias.map((dia, i) => {
    exigir(dia && esTexto(dia.nombre ?? '', 60), `El nombre del día ${i + 1} no es válido.`)
    exigir(Array.isArray(dia.ejercicios) && dia.ejercicios.length <= 40, `Los ejercicios del día ${i + 1} no son válidos.`)
    return {
      nombre: dia.nombre ?? '',
      ejercicios: dia.ejercicios.map((e) => {
        exigir(
          e &&
            esTexto(e.uid, 60) &&
            esEntero(e.ejercicioId, 1, Number.MAX_SAFE_INTEGER) &&
            esEntero(e.series, 1, 20) &&
            esTexto(e.reps, 20) &&
            esEntero(e.descanso, 0, 900),
          `Hay un ejercicio con datos inválidos en el día ${i + 1}.`
        )
        return { uid: e.uid, ejercicioId: e.ejercicioId, series: e.series, reps: e.reps, descanso: e.descanso }
      }),
    }
  })

  return { nombre, objetivo: b.objetivo ?? '', diasPorSemana: b.diasPorSemana, dias }
}

export function validarEntrenamiento(b) {
  exigir(b && typeof b === 'object', 'Faltan los datos del entrenamiento.')
  exigir(esNumero(b.inicio, 0, 8.64e15) && esNumero(b.fin, 0, 8.64e15) && b.fin >= b.inicio, 'Las fechas del entrenamiento no son válidas.')
  exigir(esEntero(b.duracionSeg, 0, 86400), 'La duración no es válida.')
  exigir(b.rutinaId == null || esEntero(b.rutinaId, 0, Number.MAX_SAFE_INTEGER), 'La rutina no es válida.')
  exigir(esTexto(b.rutinaNombre ?? '', 100) && esTexto(b.diaNombre ?? '', 60), 'Los nombres no son válidos.')
  exigir(esEntero(b.diaIndice ?? 0, 0, 6), 'El día no es válido.')
  exigir(Array.isArray(b.ejercicios) && b.ejercicios.length <= 60, 'Los ejercicios no son válidos.')

  const ejercicios = b.ejercicios.map((e) => {
    exigir(
      e && esEntero(e.ejercicioId, 1, Number.MAX_SAFE_INTEGER) && Array.isArray(e.series) && e.series.length <= 50,
      'Hay un ejercicio con datos inválidos.'
    )
    return {
      ejercicioId: e.ejercicioId,
      series: e.series.map((s) => {
        exigir(s && esNumero(s.peso, 0, 2000) && esEntero(s.reps, 0, 1000), 'Hay una serie con peso o repeticiones inválidos.')
        return { peso: s.peso, reps: s.reps }
      }),
    }
  })

  // El volumen se calcula acá para no depender del que manda el frontend
  const volumen = Math.round(ejercicios.reduce((t, e) => t + e.series.reduce((u, s) => u + s.peso * s.reps, 0), 0))

  return {
    inicio: Math.round(b.inicio),
    fin: Math.round(b.fin),
    duracionSeg: b.duracionSeg,
    rutinaId: b.rutinaId ?? null,
    rutinaNombre: b.rutinaNombre ?? '',
    diaIndice: b.diaIndice ?? 0,
    diaNombre: b.diaNombre ?? '',
    volumen,
    ejercicios,
    demo: Boolean(b.demo),
  }
}

// Solo se aceptan los ajustes conocidos, con su tipo correcto
const REGLAS_AJUSTES = {
  nombre: (v) => esTexto(v, 50),
  apellido: (v) => esTexto(v, 50),
  objetivoTitulo: (v) => esTexto(v, 80),
  objetivoDescripcion: (v) => esTexto(v, 300),
  metaSemanal: (v) => esEntero(v, 1, 7),
  sonido: (v) => typeof v === 'boolean',
  vibracion: (v) => typeof v === 'boolean',
  pantallaEncendida: (v) => typeof v === 'boolean',
}

export function validarAjustes(b) {
  exigir(b && typeof b === 'object' && !Array.isArray(b), 'Los ajustes no son válidos.')
  const limpios = {}
  for (const [clave, valor] of Object.entries(b)) {
    if (!(clave in REGLAS_AJUSTES)) continue // se ignoran claves desconocidas
    exigir(REGLAS_AJUSTES[clave](valor), `El ajuste "${clave}" no es válido.`)
    limpios[clave] = valor
  }
  return limpios
}

export function validarCredenciales(b, registro = false) {
  const email = typeof b?.email === 'string' ? b.email.trim().toLowerCase() : ''
  const password = typeof b?.password === 'string' ? b.password : ''
  exigir(/^\S+@\S+\.\S+$/.test(email) && email.length <= 120, 'Ingresá un email válido.')
  exigir(password.length >= 6 && password.length <= 200, 'La contraseña debe tener al menos 6 caracteres.')
  if (!registro) return { email, password }

  const nombre = typeof b.nombre === 'string' ? b.nombre.trim() : ''
  exigir(nombre.length >= 2 && nombre.length <= 50, 'Ingresá tu nombre.')
  return { email, password, nombre }
}
