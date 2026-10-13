import { useSearchParams } from 'react-router-dom'
import ListaRutinas from './ListaRutinas'
import EditorRutina from './EditorRutina'
import { useRutinas } from '../../context/rutinasContext'
import './Rutina.css'

/**
 * Sección "Mis rutinas".
 * - Sin parámetros: muestra la lista con la tarjeta "Nueva rutina".
 * - Con ?id=1 (o al tocar una rutina): abre el editor de esa rutina.
 * - Con ?id=nueva: abre el editor vacío.
 *
 * Las rutinas se guardan en el navegador (ver RutinasProvider).
 */
function Rutina() {
  const { rutinas, guardarRutina, eliminarRutina, buscarRutina } = useRutinas()
  const [params, setParams] = useSearchParams()
  const idAbierto = params.get('id')
  const rutina = idAbierto ? buscarRutina(idAbierto) : undefined

  function cerrar() {
    setParams({})
  }

  // Si el id no existe (y no es "nueva"), se muestra la lista
  if (idAbierto === 'nueva' || rutina) {
    return (
      <EditorRutina
        // key hace que el editor se reinicie al cambiar de rutina
        key={idAbierto}
        rutinaInicial={rutina ?? null}
        onGuardar={(r) => {
          guardarRutina(r)
          cerrar()
        }}
        onEliminar={(id) => {
          eliminarRutina(id)
          cerrar()
        }}
        onVolver={cerrar}
      />
    )
  }

  return <ListaRutinas rutinas={rutinas} onAbrir={(id) => setParams({ id: String(id) })} />
}

export default Rutina
