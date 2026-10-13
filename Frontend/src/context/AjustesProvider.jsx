import { useEffect, useRef } from 'react'
import { AjustesContext, AJUSTES_INICIALES } from './ajustesContext'
import { useCarga } from '../hooks/useCarga'
import { api } from '../api/cliente'
import Cargando from '../components/layout/Cargando'

const ESPERA_GUARDADO_MS = 600

/**
 * Ajustes del usuario: perfil, objetivo y preferencias del entrenamiento.
 * Se leen del backend al entrar y se guardan solos poco después de cada cambio
 * (se espera un momento para no mandar una petición por cada letra que escribís).
 */
function AjustesProvider({ children }) {
  const { datos, setDatos, estado, error, recargar } = useCarga('/ajustes')
  const pendientes = useRef({})
  const temporizador = useRef(null)

  function guardarPendientes() {
    clearTimeout(temporizador.current)
    const cambios = pendientes.current
    pendientes.current = {}
    if (Object.keys(cambios).length === 0) return
    api('/ajustes', { metodo: 'PUT', cuerpo: cambios }).catch((err) => {
      alert(`No se pudieron guardar los ajustes: ${err.message}`)
    })
  }

  function cambiarAjuste(clave, valor) {
    setDatos((prev) => ({ ...prev, [clave]: valor }))
    pendientes.current[clave] = valor
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(guardarPendientes, ESPERA_GUARDADO_MS)
  }

  // Si se sale de la app con cambios sin mandar, se mandan en ese momento
  useEffect(() => () => guardarPendientes(), []) // eslint-disable-line react-hooks/exhaustive-deps

  if (estado !== 'listo') return <Cargando error={error} onReintentar={recargar} />

  const ajustes = { ...AJUSTES_INICIALES, ...datos }
  return <AjustesContext.Provider value={{ ajustes, cambiarAjuste }}>{children}</AjustesContext.Provider>
}

export default AjustesProvider
