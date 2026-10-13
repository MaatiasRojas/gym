import { useSearchParams } from 'react-router-dom'
import ListaEjercicios from './ListaEjercicios'
import FormEjercicio from './FormEjercicio'
import { useEjercicios } from '../../context/ejerciciosContext'
import './Ejercicio.css'

/**
 * Sección "Ejercicios".
 * - Sin parámetros: lista de todos los ejercicios.
 * - ?id=nuevo: formulario para crear un ejercicio.
 * - ?id=5: formulario para editar ese ejercicio.
 */
function Ejercicio() {
  const { buscarEjercicio, guardarEjercicio, eliminarEjercicio } = useEjercicios()
  const [params, setParams] = useSearchParams()
  const id = params.get('id')
  const ejercicio = id ? buscarEjercicio(id) : undefined

  function volver() {
    setParams({})
  }

  if (id === 'nuevo' || ejercicio) {
    return (
      <FormEjercicio
        key={id}
        ejercicioInicial={ejercicio ?? null}
        onGuardar={(e) => {
          guardarEjercicio(e)
          volver()
        }}
        onEliminar={(idEliminar) => {
          eliminarEjercicio(idEliminar)
          volver()
        }}
        onVolver={volver}
      />
    )
  }

  return <ListaEjercicios onAbrir={(idAbrir) => setParams({ id: String(idAbrir) })} />
}

export default Ejercicio
