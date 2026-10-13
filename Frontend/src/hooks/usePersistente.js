import { useEffect, useState } from 'react'

const PREFIJO = 'gymtrack:'

/**
 * Igual que useState, pero guarda el valor en el navegador (localStorage)
 * para que no se pierda al recargar la página o cerrar Safari.
 *
 * Para borrar todos los datos guardados, en la consola del navegador:
 *   Object.keys(localStorage).filter(k => k.startsWith('gymtrack:')).forEach(k => localStorage.removeItem(k))
 */
export function usePersistente(clave, valorInicial) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = localStorage.getItem(PREFIJO + clave)
      if (guardado !== null) return JSON.parse(guardado)
    } catch {
      // modo privado o datos dañados: se usa el valor inicial
    }
    return typeof valorInicial === 'function' ? valorInicial() : valorInicial
  })

  useEffect(() => {
    try {
      localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
    } catch (err) {
      // puede pasar si se llena el espacio (por ejemplo, con muchas imágenes)
      console.warn(`No se pudo guardar "${clave}"`, err)
    }
  }, [clave, valor])

  return [valor, setValor]
}
