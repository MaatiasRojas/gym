import Icono from '../iconos/Icono'

/**
 * Pantalla de carga, o de error con botón para reintentar.
 *   <Cargando />                                   -> "Cargando…"
 *   <Cargando error="mensaje" onReintentar={fn} />  -> error
 */
function Cargando({ error, onReintentar, texto = 'Cargando…' }) {
  if (error) {
    return (
      <div className="pantalla-carga">
        <Icono nombre="alerta" tamano={32} />
        <p>{error}</p>
        {onReintentar && (
          <button type="button" className="boton" onClick={onReintentar}>
            Reintentar
          </button>
        )}
      </div>
    )
  }
  return (
    <div className="pantalla-carga" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  )
}

export default Cargando
