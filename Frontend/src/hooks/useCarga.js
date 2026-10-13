import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/cliente'

/**
 * Carga datos de la API al montar el componente.
 *   const { datos, setDatos, estado, error, recargar } = useCarga('/rutinas')
 * estado: 'cargando' | 'listo' | 'error'
 */
export function useCarga(ruta) {
  const [datos, setDatos] = useState(null)
  const [estado, setEstado] = useState('cargando')
  const [error, setError] = useState(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    return api(ruta)
      .then((d) => {
        setDatos(d)
        setEstado('listo')
      })
      .catch((err) => {
        setError(err.message)
        setEstado('error')
      })
  }, [ruta])

  useEffect(() => {
    let cancelado = false
    api(ruta)
      .then((d) => {
        if (cancelado) return
        setDatos(d)
        setEstado('listo')
      })
      .catch((err) => {
        if (cancelado) return
        setError(err.message)
        setEstado('error')
      })
    return () => {
      cancelado = true
    }
  }, [ruta])

  return { datos, setDatos, estado, error, recargar }
}
