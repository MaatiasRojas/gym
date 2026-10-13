import { useEffect, useState } from 'react'

// Devuelve la hora actual (en ms) y se actualiza cada `cadaMs`. Sirve para cronómetros.
export function useAhora(cadaMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs)
    return () => clearInterval(id)
  }, [cadaMs])

  return ahora
}
