// Grupos musculares disponibles y el color de su etiqueta (ver .tag--* en index.css)
export const MUSCULOS = [
  { nombre: 'Pecho', color: 'rosa' },
  { nombre: 'Espalda', color: 'azul' },
  { nombre: 'Hombros', color: 'celeste' },
  { nombre: 'Bíceps', color: 'verde' },
  { nombre: 'Tríceps', color: 'violeta' },
  { nombre: 'Piernas', color: 'naranja' },
  { nombre: 'Glúteos', color: 'ambar' },
  { nombre: 'Core', color: 'gris' },
]

export function colorMusculo(nombre) {
  return MUSCULOS.find((m) => m.nombre === nombre)?.color ?? 'gris'
}
