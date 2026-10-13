import { useEffect, useRef, useState } from 'react'
import { useAjustes } from '../context/ajustesContext'

/**
 * Temporizador de descanso. Cada componente que lo usa tiene el suyo.
 * activo = { uid, restante, total } o null
 * alTerminar (opcional): función que se llama cuando llega a cero.
 *
 * Usa la hora real de fin, así no se atrasa si el celular pausa la página.
 */
export function useTemporizador(alTerminar) {
  const { ajustes } = useAjustes()
  const [activo, setActivo] = useState(null)
  const intervalo = useRef(null)
  const fin = useRef(0)
  const alTerminarRef = useRef(alTerminar)
  useEffect(() => {
    alTerminarRef.current = alTerminar
  })

  function limpiar() {
    clearInterval(intervalo.current)
    intervalo.current = null
  }

  function detener() {
    limpiar()
    setActivo(null)
  }

  function iniciar(uid, segundos) {
    limpiar()
    fin.current = Date.now() + segundos * 1000
    setActivo({ uid, restante: segundos, total: segundos })

    intervalo.current = setInterval(() => {
      const restante = Math.ceil((fin.current - Date.now()) / 1000)
      if (restante <= 0) {
        limpiar()
        setActivo(null)
        avisarFin(ajustes)
        alTerminarRef.current?.()
      } else {
        setActivo((t) => (t ? { ...t, restante } : t))
      }
    }, 250)
  }

  // Suma (o resta) segundos al temporizador que está corriendo
  function sumar(segundos) {
    if (!intervalo.current) return
    fin.current += segundos * 1000
    setActivo((t) =>
      t ? { ...t, restante: Math.max(1, t.restante + segundos), total: Math.max(1, t.total + segundos) } : t
    )
  }

  // Limpia el intervalo al salir de la pantalla
  useEffect(() => () => clearInterval(intervalo.current), [])

  return { activo, iniciar, detener, sumar }
}

// Pitido corto al terminar el descanso (y vibración en Android), según los ajustes
function avisarFin({ sonido, vibracion }) {
  if (vibracion) navigator.vibrate?.(400)
  if (!sonido) return
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
    osc.onended = () => ctx.close()
  } catch {
    // el navegador no soporta audio: no pasa nada
  }
}

export function formatearTiempo(seg) {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = String(seg % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
