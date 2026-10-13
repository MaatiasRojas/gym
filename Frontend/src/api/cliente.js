// Cliente para hablar con el backend.
// En desarrollo, Vite redirige /api al backend (ver vite.config.js).
// Para otro servidor, definí VITE_API_URL en un archivo .env del frontend.

const BASE = import.meta.env.VITE_API_URL ?? '/api'
const CLAVE_TOKEN = 'gymtrack:token'

let token = leerToken()

function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

export function guardarToken(nuevo) {
  token = nuevo
  try {
    if (nuevo) localStorage.setItem(CLAVE_TOKEN, nuevo)
    else localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    // modo privado: la sesión dura hasta cerrar la pestaña
  }
}

export function hayToken() {
  return Boolean(token)
}

// Evento que avisa a la app que la sesión venció (lo escucha AuthProvider)
export const SESION_VENCIDA = 'gymtrack:sesion-vencida'

/**
 * Hace una petición a la API y devuelve el JSON de la respuesta.
 * Si algo sale mal lanza un Error con un mensaje para mostrarle al usuario.
 *
 *   const rutinas = await api('/rutinas')
 *   await api('/rutinas', { metodo: 'POST', cuerpo: rutina })
 */
export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  let respuesta
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
  }

  if (respuesta.status === 204) return null

  let datos = null
  try {
    datos = await respuesta.json()
  } catch {
    // respuesta vacía o que no es JSON
  }

  if (respuesta.status === 401 && token) {
    guardarToken(null)
    window.dispatchEvent(new Event(SESION_VENCIDA))
  }

  if (!respuesta.ok) {
    throw new Error(datos?.error ?? `Error del servidor (${respuesta.status}).`)
  }
  return datos
}
