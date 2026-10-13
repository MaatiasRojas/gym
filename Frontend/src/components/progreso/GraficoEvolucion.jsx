import { useEffect, useRef, useState } from 'react'
import { fechaCorta, formatearKg } from '../../utils/progreso'

const ALTO = 220
const M = { arriba: 16, derecha: 16, abajo: 28, izquierda: 44 }

// Mide el ancho del contenedor para dibujar el gráfico en píxeles reales
function useAncho(ref) {
  const [ancho, setAncho] = useState(600)
  useEffect(() => {
    const obs = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width))
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return ancho
}

// Marcas "redondas" para el eje Y
function marcasY(min, max, cantidad = 4) {
  const rango = max - min || 1
  const paso0 = rango / cantidad
  const mag = 10 ** Math.floor(Math.log10(paso0))
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((p) => p >= paso0)
  const inicio = Math.floor(min / paso) * paso
  const marcas = []
  for (let v = inicio; v <= max + paso * 0.001; v += paso) marcas.push(Math.round(v * 100) / 100)
  if (marcas[marcas.length - 1] < max) marcas.push(marcas[marcas.length - 1] + paso)
  return marcas
}

/**
 * Gráfico de línea de un ejercicio a lo largo del tiempo.
 * puntos: [{ fecha, valor, mejor: {peso, reps}, record }]
 */
function GraficoEvolucion({ puntos, metrica }) {
  const contenedor = useRef(null)
  const ancho = useAncho(contenedor)

  return (
    <div ref={contenedor} className="grafico">
      {puntos.length === 0 ? (
        <p className="grafico--vacio">No hay registros de este ejercicio en el período.</p>
      ) : (
        <Lienzo puntos={puntos} metrica={metrica} ancho={ancho} />
      )}
    </div>
  )
}

function Lienzo({ puntos, metrica, ancho }) {
  const [activo, setActivo] = useState(null) // índice del punto con hover

  const formato = (v) => (metrica === 'volumen' ? formatearKg(v) : `${v.toLocaleString('es-AR')} kg`)

  // ---------- Escalas ----------
  const valores = puntos.map((p) => p.valor)
  const marcas = marcasY(Math.min(...valores), Math.max(...valores))
  const yMin = marcas[0]
  const yMax = marcas[marcas.length - 1] === yMin ? yMin + 1 : marcas[marcas.length - 1]
  const tMin = puntos[0].fecha
  const tMax = puntos[puntos.length - 1].fecha
  const anchoUtil = ancho - M.izquierda - M.derecha
  const altoUtil = ALTO - M.arriba - M.abajo

  const x = (t) => (tMax === tMin ? M.izquierda + anchoUtil / 2 : M.izquierda + ((t - tMin) / (tMax - tMin)) * anchoUtil)
  const y = (v) => M.arriba + altoUtil - ((v - yMin) / (yMax - yMin)) * altoUtil

  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(p.fecha)},${y(p.valor)}`).join(' ')
  const area = `${linea} L${x(tMax)},${y(yMin)} L${x(tMin)},${y(yMin)} Z`

  // Etiquetas de fecha: hasta 5, repartidas
  const cantidadFechas = Math.min(5, puntos.length, Math.max(2, Math.floor(anchoUtil / 90)))
  const fechas =
    tMax === tMin
      ? [tMin]
      : Array.from({ length: cantidadFechas }, (_, i) => tMin + ((tMax - tMin) * i) / (cantidadFechas - 1))

  // ---------- Hover / toque: el punto más cercano en X ----------
  function alMover(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    let mejor = 0
    puntos.forEach((p, i) => {
      if (Math.abs(x(p.fecha) - px) < Math.abs(x(puntos[mejor].fecha) - px)) mejor = i
    })
    setActivo(mejor)
  }

  const p = activo !== null ? (puntos[activo] ?? null) : null
  const tooltipIzq = p ? Math.min(Math.max(x(p.fecha) - 70, 0), ancho - 150) : 0

  return (
    <>
      <svg
        width={ancho}
        height={ALTO}
        onPointerMove={alMover}
        onPointerDown={alMover}
        onPointerLeave={() => setActivo(null)}
        role="img"
        aria-label={`Evolución: de ${formato(puntos[0].valor)} a ${formato(puntos[puntos.length - 1].valor)}`}
      >
        {/* grilla y eje Y */}
        {marcas.map((m) => (
          <g key={m}>
            <line x1={M.izquierda} x2={ancho - M.derecha} y1={y(m)} y2={y(m)} className="grafico__grilla" />
            <text x={M.izquierda - 8} y={y(m) + 4} textAnchor="end" className="grafico__eje">
              {metrica === 'volumen' && m >= 1000 ? `${Math.round(m / 100) / 10}k` : m}
            </text>
          </g>
        ))}
        {/* eje X */}
        {fechas.map((f, i) => (
          <text
            key={i}
            x={x(f)}
            y={ALTO - 8}
            textAnchor={i === 0 && fechas.length > 1 ? 'start' : i === fechas.length - 1 && fechas.length > 1 ? 'end' : 'middle'}
            className="grafico__eje"
          >
            {fechaCorta(f)}
          </text>
        ))}

        <path d={area} className="grafico__area" />
        <path d={linea} className="grafico__linea" />

        {p && <line x1={x(p.fecha)} x2={x(p.fecha)} y1={M.arriba} y2={y(yMin)} className="grafico__cruz" />}

        {puntos.map((pt, i) => (
          <circle
            key={i}
            cx={x(pt.fecha)}
            cy={y(pt.valor)}
            r={pt.record ? 6 : i === activo ? 5 : 4}
            className={pt.record ? 'grafico__punto grafico__punto--record' : 'grafico__punto'}
          />
        ))}
      </svg>

      {p && (
        <div className="grafico__tooltip" style={{ left: tooltipIzq, top: Math.max(0, y(p.valor) - 64) }}>
          <span>
            {new Date(p.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
            {p.record && ' · récord'}
          </span>
          <strong>{formato(p.valor)}</strong>
          {metrica !== 'peso' && (
            <small>
              Mejor serie: {p.mejor.peso} kg × {p.mejor.reps}
            </small>
          )}
          {metrica === 'peso' && <small>× {p.mejor.reps} reps</small>}
        </div>
      )}
    </>
  )
}

export default GraficoEvolucion
