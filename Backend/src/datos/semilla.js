// Datos con los que empieza cada usuario nuevo.
// Los ids de acá son solo para relacionar la rutina de ejemplo con los ejercicios:
// al guardarlos en la base cada uno recibe un id nuevo.

export const EJERCICIOS_BASE = [
  {
    id: 1,
    nombre: 'Press de banca plano',
    musculos: ['Pecho', 'Tríceps'],
    descripcion:
      'Ejercicio compuesto que trabaja principalmente el pectoral mayor, los tríceps y los hombros.',
    consejos: [
      'Mantené los omóplatos juntos y apoyados en el banco.',
      'Bajá la barra controlada hasta la mitad del pecho.',
      'Apoyá bien los pies en el piso.',
    ],
    errores: ['Rebotar la barra en el pecho.', 'Levantar los glúteos del banco.'],
    variantes: ['Press con mancuernas', 'Press inclinado', 'Press declinado'],
  },
  { id: 2, nombre: 'Press inclinado con mancuernas', musculos: ['Pecho', 'Tríceps'] },
  { id: 3, nombre: 'Aperturas en polea', musculos: ['Pecho'] },
  { id: 4, nombre: 'Extensión de tríceps en polea', musculos: ['Tríceps'] },
  { id: 5, nombre: 'Extensión de tríceps por encima de la cabeza', musculos: ['Tríceps'] },
  { id: 6, nombre: 'Dominadas', musculos: ['Espalda', 'Bíceps'] },
  { id: 7, nombre: 'Remo con barra', musculos: ['Espalda'] },
  { id: 8, nombre: 'Jalón al pecho', musculos: ['Espalda', 'Bíceps'] },
  { id: 9, nombre: 'Curl de bíceps con barra', musculos: ['Bíceps'] },
  { id: 10, nombre: 'Curl martillo', musculos: ['Bíceps'] },
  {
    id: 11,
    nombre: 'Sentadilla',
    musculos: ['Piernas', 'Glúteos'],
    descripcion: 'Ejercicio básico de piernas que trabaja cuádriceps, glúteos e isquiotibiales.',
    consejos: ['Mantené el pecho arriba y la espalda neutra.', 'Las rodillas siguen la línea de los pies.'],
    errores: ['Levantar los talones.', 'Dejar que las rodillas se vayan hacia adentro.'],
    variantes: ['Sentadilla frontal', 'Sentadilla goblet', 'Sentadilla búlgara'],
  },
  { id: 12, nombre: 'Peso muerto rumano', musculos: ['Piernas', 'Glúteos'] },
  { id: 13, nombre: 'Prensa de piernas', musculos: ['Piernas'] },
  { id: 14, nombre: 'Hip thrust', musculos: ['Glúteos'] },
  { id: 15, nombre: 'Press militar', musculos: ['Hombros', 'Tríceps'] },
  { id: 16, nombre: 'Elevaciones laterales', musculos: ['Hombros'] },
  { id: 17, nombre: 'Plancha', musculos: ['Core'] },
]

// Rutina de ejemplo para que la app no arranque vacía
export const RUTINA_EJEMPLO =
{
  id: 1,
  nombre: 'Push - Torso',
  objetivo: 'Hipertrofia',
  diasPorSemana: 3,
  dias: [
    {
      nombre: 'Pecho + Tríceps',
      ejercicios: [
        { uid: 'a1', ejercicioId: 1, series: 4, reps: '8 - 10', descanso: 90 },
        { uid: 'a2', ejercicioId: 2, series: 4, reps: '10 - 12', descanso: 75 },
        { uid: 'a3', ejercicioId: 3, series: 3, reps: '12 - 15', descanso: 60 },
        { uid: 'a4', ejercicioId: 4, series: 3, reps: '10 - 12', descanso: 60 },
        { uid: 'a5', ejercicioId: 5, series: 3, reps: '12 - 15', descanso: 60 },
      ],
    },
    {
      nombre: 'Espalda + Bíceps',
      ejercicios: [
        { uid: 'b1', ejercicioId: 6, series: 4, reps: '6 - 8', descanso: 120 },
        { uid: 'b2', ejercicioId: 7, series: 4, reps: '8 - 10', descanso: 90 },
        { uid: 'b3', ejercicioId: 9, series: 3, reps: '10 - 12', descanso: 60 },
      ],
    },
    {
      nombre: 'Piernas + Glúteos',
      ejercicios: [
        { uid: 'c1', ejercicioId: 11, series: 4, reps: '6 - 8', descanso: 120 },
        { uid: 'c2', ejercicioId: 12, series: 3, reps: '8 - 10', descanso: 90 },
        { uid: 'c3', ejercicioId: 14, series: 3, reps: '10 - 12', descanso: 75 },
        { uid: 'c4', ejercicioId: 13, series: 3, reps: '12 - 15', descanso: 60 },
      ],
    },
  ],
}
