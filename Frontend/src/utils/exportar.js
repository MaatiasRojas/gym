// Exportar e importar los datos de la app
import { api } from '../api/cliente'

// Descarga un archivo en el navegador (funciona también en el iPhone)
export function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function fechaArchivo() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Historial en CSV para abrir con Excel: una fila por serie.
 * Usa ";" como separador y coma decimal, que es lo que espera Excel en español.
 */
export function exportarCSV(historial, buscarEjercicio) {
  const celda = (v) => {
    const texto = String(v ?? '')
    return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const numero = (n) => String(n).replace('.', ',')

  const filas = [['Fecha', 'Hora', 'Rutina', 'Día', 'Ejercicio', 'Serie', 'Peso (kg)', 'Repeticiones']]
  for (const s of historial) {
    const fecha = new Date(s.inicio)
    for (const e of s.ejercicios) {
      const nombre = buscarEjercicio(e.ejercicioId)?.nombre ?? 'Ejercicio eliminado'
      e.series.forEach((serie, i) => {
        filas.push([
          fecha.toLocaleDateString('es-AR'),
          fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          s.rutinaNombre,
          s.diaNombre,
          nombre,
          i + 1,
          numero(serie.peso),
          serie.reps,
        ])
      })
    }
  }

  // "﻿" al principio hace que Excel reconozca los acentos
  const csv = '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n')
  descargar(`gymtrack-historial-${fechaArchivo()}.csv`, csv, 'text/csv;charset=utf-8')
}

// Copia de seguridad: el backend arma un archivo con todos los datos del usuario
export async function exportarCopia() {
  const copia = await api('/datos')
  descargar(`gymtrack-copia-${fechaArchivo()}.json`, JSON.stringify(copia, null, 2), 'application/json')
}

// Lee un archivo de copia y lo valida. Devuelve los datos o lanza un error con un mensaje claro.
export async function leerCopia(archivo) {
  let copia
  try {
    copia = JSON.parse(await archivo.text())
  } catch {
    throw new Error('El archivo no es una copia de GymTrack válida.')
  }
  if (copia?.app !== 'GymTrack' || typeof copia.datos !== 'object') {
    throw new Error('El archivo no es una copia de GymTrack válida.')
  }
  return copia
}

// Reemplaza los datos del usuario por los de la copia y recarga la app
export async function restaurarCopia(copia) {
  await api('/datos/restaurar', { metodo: 'POST', cuerpo: copia })
  window.location.assign('/')
}

// Deja la cuenta como recién creada y recarga la app
export async function borrarTodoYReiniciar() {
  await api('/datos', { metodo: 'DELETE' })
  try {
    localStorage.removeItem('gymtrack:sesionActiva')
  } catch {
    // nada
  }
  window.location.assign('/')
}
