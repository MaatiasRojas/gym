import Icono from '../iconos/Icono'

function ListaRutinas({ rutinas, onAbrir }) {
  return (
    <div className="rutinas">
      <header className="pagina__header">
        <h1>Mis rutinas</h1>
        <p className="texto-suave">Armá tus rutinas y elegí cuál entrenar.</p>
      </header>

      <div className="rutinas__grilla">
        <button type="button" className="rutina-card rutina-card--nueva" onClick={() => onAbrir('nueva')}>
          <span className="rutina-card__mas">
            <Icono nombre="mas" tamano={22} />
          </span>
          <strong>Nueva rutina</strong>
          <span className="texto-suave">Elegí ejercicios, series y descansos</span>
        </button>

        {rutinas.map((rutina) => {
          const totalEjercicios = rutina.dias.reduce((t, d) => t + d.ejercicios.length, 0)
          return (
            <button
              type="button"
              key={rutina.id}
              className="rutina-card"
              onClick={() => onAbrir(rutina.id)}
            >
              <div className="rutina-card__top">
                <span className="chip">{rutina.objetivo}</span>
                <Icono nombre="lapiz" tamano={16} className="rutina-card__editar" />
              </div>
              <strong className="rutina-card__nombre">{rutina.nombre}</strong>
              <span className="texto-suave">
                {rutina.diasPorSemana} días · {totalEjercicios} ejercicios
              </span>
              <ul className="rutina-card__dias">
                {rutina.dias.map((dia, i) => (
                  <li key={i}>{dia.nombre || `Día ${i + 1}`}</li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ListaRutinas
