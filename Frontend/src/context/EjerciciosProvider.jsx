import { EjerciciosContext } from './ejerciciosContext'
import { useCarga } from '../hooks/useCarga'
import { api } from '../api/cliente'
import Cargando from '../components/layout/Cargando'

/**
 * Biblioteca de ejercicios del usuario, guardada en el backend.
 * La comparten la página Ejercicios y el selector de ejercicios de las rutinas.
 */
function EjerciciosProvider({ children }) {
  const { datos: ejercicios, setDatos: setEjercicios, estado, error, recargar } = useCarga('/ejercicios')

  // Si algo falla, avisa y vuelve a traer la lista real del servidor
  function alFallar(err) {
    alert(`No se pudo guardar el cambio: ${err.message}`)
    api('/ejercicios').then(setEjercicios).catch(() => {})
  }

  // Crea o actualiza. Devuelve el ejercicio guardado (con el id del servidor).
  async function guardarEjercicio(ejercicio) {
    const existe = ejercicios.some((e) => e.id === ejercicio.id)
    try {
      if (existe) {
        setEjercicios((prev) => prev.map((e) => (e.id === ejercicio.id ? ejercicio : e)))
        return await api(`/ejercicios/${ejercicio.id}`, { metodo: 'PUT', cuerpo: ejercicio })
      }
      const creado = await api('/ejercicios', { metodo: 'POST', cuerpo: ejercicio })
      setEjercicios((prev) => [...prev, creado])
      return creado
    } catch (err) {
      alFallar(err)
    }
  }

  async function eliminarEjercicio(id) {
    setEjercicios((prev) => prev.filter((e) => e.id !== id))
    try {
      await api(`/ejercicios/${id}`, { metodo: 'DELETE' })
    } catch (err) {
      alFallar(err)
    }
  }

  function buscarEjercicio(id) {
    return ejercicios.find((e) => String(e.id) === String(id))
  }

  if (estado !== 'listo') return <Cargando error={error} onReintentar={recargar} />

  return (
    <EjerciciosContext.Provider value={{ ejercicios, guardarEjercicio, eliminarEjercicio, buscarEjercicio }}>
      {children}
    </EjerciciosContext.Provider>
  )
}

export default EjerciciosProvider
