import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icono from '../iconos/Icono'
import { useAuth } from '../../context/authContext'
import './InicioSesion.css'

const FORM_VACIO = { nombre: '', email: '', password: '', confirmar: '' }

// Valida los campos según el modo. Devuelve un objeto { campo: 'mensaje' }
function validar(datos, modo) {
  const errores = {}

  if (modo === 'registro' && datos.nombre.trim().length < 2) {
    errores.nombre = 'Ingresá tu nombre.'
  }
  if (!/^\S+@\S+\.\S+$/.test(datos.email)) {
    errores.email = 'Ingresá un email válido.'
  }
  if (datos.password.length < 6) {
    errores.password = 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (modo === 'registro' && datos.confirmar !== datos.password) {
    errores.confirmar = 'Las contraseñas no coinciden.'
  }

  return errores
}

/**
 * Pantalla de inicio de sesión / registro, conectada al backend.
 * Al entrar bien, vuelve a la página que se quería ver (o al inicio).
 */
function InicioSesion() {
  const { usuario, iniciarSesion, registrarse } = useAuth()
  const location = useLocation()
  const [modo, setModo] = useState('login') // 'login' | 'registro'
  const [datos, setDatos] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const esRegistro = modo === 'registro'

  // Si ya hay sesión iniciada no tiene sentido mostrar el login
  if (usuario) return <Navigate to={location.state?.desde ?? '/'} replace />

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo)
    setErrores({})
    setErrorGeneral('')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setDatos((prev) => ({ ...prev, [name]: value }))
    // Borra el error del campo mientras el usuario lo corrige
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nuevosErrores = validar(datos, modo)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setCargando(true)
    setErrorGeneral('')
    try {
      if (modo === 'registro') {
        await registrarse(datos.nombre.trim(), datos.email.trim(), datos.password)
      } else {
        await iniciarSesion(datos.email.trim(), datos.password)
      }
      navigate(location.state?.desde ?? '/', { replace: true })
    } catch (err) {
      setErrorGeneral(err.message || 'Algo salió mal. Probá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="sesion">
      <div className="sesion__caja">
        <div className="sesion__logo">
          <span className="sesion__logo-icono">
            <Icono nombre="pesa" tamano={26} />
          </span>
          <span>GymTrack</span>
        </div>

        <h1 className="sesion__titulo">
          {esRegistro ? 'Creá tu cuenta' : 'Bienvenido de nuevo'}
        </h1>
        <p className="sesion__subtitulo">
          {esRegistro
            ? 'Empezá a registrar tus entrenamientos.'
            : 'Ingresá para ver tu progreso.'}
        </p>

        <div className="sesion__pestanas" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!esRegistro}
            className={!esRegistro ? 'activa' : ''}
            onClick={() => cambiarModo('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={esRegistro}
            className={esRegistro ? 'activa' : ''}
            onClick={() => cambiarModo('registro')}
          >
            Registrarse
          </button>
        </div>

        <form className="sesion__form" onSubmit={handleSubmit} noValidate>
          {esRegistro && (
            <Campo
              label="Nombre"
              name="nombre"
              autoComplete="given-name"
              value={datos.nombre}
              onChange={handleChange}
              error={errores.nombre}
            />
          )}

          <Campo
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={datos.email}
            onChange={handleChange}
            error={errores.email}
          />

          <Campo
            label="Contraseña"
            name="password"
            type={verPassword ? 'text' : 'password'}
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            value={datos.password}
            onChange={handleChange}
            error={errores.password}
            extra={
              <button
                type="button"
                className="campo__ojo"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Icono nombre={verPassword ? 'ojoCerrado' : 'ojo'} tamano={18} />
              </button>
            }
          />

          {esRegistro && (
            <Campo
              label="Repetir contraseña"
              name="confirmar"
              type={verPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={datos.confirmar}
              onChange={handleChange}
              error={errores.confirmar}
            />
          )}

          {!esRegistro && (
            <button type="button" className="sesion__olvido">
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {errorGeneral && (
            <p className="sesion__error" role="alert">
              <Icono nombre="alerta" tamano={16} /> {errorGeneral}
            </p>
          )}

          <button type="submit" className="sesion__boton" disabled={cargando}>
            {cargando ? 'Cargando…' : esRegistro ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>

        <p className="sesion__cambiar">
          {esRegistro ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <button type="button" onClick={() => cambiarModo(esRegistro ? 'login' : 'registro')}>
            {esRegistro ? 'Iniciá sesión' : 'Registrate'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Campo({ label, name, error, extra, ...props }) {
  return (
    <div className={'campo' + (error ? ' campo--error' : '')}>
      <label htmlFor={name}>{label}</label>
      <div className="campo__input">
        <input
          id={name}
          name={name}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
        {extra}
      </div>
      {error && (
        <span id={`${name}-error`} className="campo__mensaje">
          {error}
        </span>
      )}
    </div>
  )
}

export default InicioSesion
