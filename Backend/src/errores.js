// Errores con código HTTP y mensaje para mostrarle al usuario
export class ErrorApi extends Error {
  constructor(status, mensaje) {
    super(mensaje)
    this.status = status
  }
}

// Lanza un 400 con el mensaje si la condición no se cumple
export function exigir(condicion, mensaje) {
  if (!condicion) throw new ErrorApi(400, mensaje)
}

export const noEncontrado = (que = 'Recurso') => new ErrorApi(404, `${que} no encontrado.`)
