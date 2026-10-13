import { RutinasContext } from './rutinasContext'
import { useCarga } from '../hooks/useCarga'
import { api } from '../api/cliente'
import Cargando from '../components/layout/Cargando'

// Rutinas del usuario, guardadas en el backend. Las usan "Mis rutinas" e "Inicio".
function RutinasProvider({ children }) {
  const { datos: rutinas, setDatos: setRutinas, estado, error, recargar } = useCarga('/rutinas')

  function alFallar(err) {
    alert(`No se pudo guardar el cambio: ${err.message}`)
    api('/rutinas').then(setRutinas).catch(() => {})
  }

  // Crea o actualiza. Devuelve la rutina guardada (con el id del servidor).
  async function guardarRutina(rutina) {
    const existe = rutinas.some((r) => r.id === rutina.id)
    try {
      if (existe) {
        setRutinas((prev) => prev.map((r) => (r.id === rutina.id ? rutina : r)))
        return await api(`/rutinas/${rutina.id}`, { metodo: 'PUT', cuerpo: rutina })
      }
      const creada = await api('/rutinas', { metodo: 'POST', cuerpo: rutina })
      setRutinas((prev) => [...prev, creada])
      return creada
    } catch (err) {
      alFallar(err)
    }
  }

  async function eliminarRutina(id) {
    setRutinas((prev) => prev.filter((r) => r.id !== id))
    try {
      await api(`/rutinas/${id}`, { metodo: 'DELETE' })
    } catch (err) {
      alFallar(err)
    }
  }

  function buscarRutina(id) {
    return rutinas.find((r) => String(r.id) === String(id))
  }

  if (estado !== 'listo') return <Cargando error={error} onReintentar={recargar} />

  return (
    <RutinasContext.Provider value={{ rutinas, guardarRutina, eliminarRutina, buscarRutina }}>
      {children}
    </RutinasContext.Provider>
  )
}

export default RutinasProvider
