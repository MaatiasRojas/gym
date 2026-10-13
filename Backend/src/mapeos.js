// Convierte lo que devuelve Prisma al formato que usa el frontend.
// (El frontend maneja las fechas como milisegundos, la base como DateTime.)

export function aEjercicio(e) {
  return {
    id: e.id,
    nombre: e.nombre,
    musculos: e.musculos,
    descripcion: e.descripcion,
    consejos: e.consejos,
    errores: e.errores,
    variantes: e.variantes,
    imagen: e.imagen ?? null,
    personalizado: e.personalizado,
  }
}

export function aRutina(r) {
  return {
    id: r.id,
    nombre: r.nombre,
    objetivo: r.objetivo,
    diasPorSemana: r.diasPorSemana,
    dias: r.dias,
  }
}

export function aEntrenamiento(e) {
  return {
    id: e.id,
    inicio: e.inicio.getTime(),
    fin: e.fin.getTime(),
    duracionSeg: e.duracionSeg,
    rutinaId: e.rutinaId,
    rutinaNombre: e.rutinaNombre,
    diaIndice: e.diaIndice,
    diaNombre: e.diaNombre,
    volumen: e.volumen,
    ejercicios: e.ejercicios,
    demo: e.demo,
  }
}

// Al revés: de lo validado (fechas en ms) a los datos para Prisma
export function datosEntrenamiento(usuarioId, e) {
  return {
    usuarioId,
    inicio: new Date(e.inicio),
    fin: new Date(e.fin),
    duracionSeg: e.duracionSeg,
    rutinaId: e.rutinaId,
    rutinaNombre: e.rutinaNombre,
    diaIndice: e.diaIndice,
    diaNombre: e.diaNombre,
    volumen: e.volumen,
    ejercicios: e.ejercicios,
    demo: e.demo,
  }
}
