import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RutaProtegida from './components/layout/RutaProtegida'
import InicioSesion from './components/inicio_sesion/InicioSesion'
import Principal from './components/principal/Principal'
import Rutina from './components/rutina/Rutina'
import Ejercicio from './components/ejercicio/Ejercicio'
import Entrenamiento from './components/entrenamiento/Entrenamiento'
import Progreso from './components/progreso/Progreso'
import Usuario from './components/usuario/Usuario'
import Ajustes from './components/ajustes/Ajustes'
import AuthProvider from './context/AuthProvider'
import AjustesProvider from './context/AjustesProvider'
import EjerciciosProvider from './context/EjerciciosProvider'
import RutinasProvider from './context/RutinasProvider'
import EntrenamientosProvider from './context/EntrenamientosProvider'

// Datos del usuario (vienen del backend). Solo se cargan con la sesión iniciada.
function DatosDelUsuario({ children }) {
  return (
    <AjustesProvider>
      <EjerciciosProvider>
        <RutinasProvider>
          <EntrenamientosProvider>{children}</EntrenamientosProvider>
        </RutinasProvider>
      </EjerciciosProvider>
    </AjustesProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login/registro: pública y sin barra lateral */}
        <Route path="/login" element={<InicioSesion />} />

        {/* Páginas internas: necesitan sesión y comparten la barra lateral */}
        <Route
          element={
            <RutaProtegida>
              <DatosDelUsuario>
                <Layout />
              </DatosDelUsuario>
            </RutaProtegida>
          }
        >
          <Route path="/" element={<Principal />} />
          <Route path="/entrenamiento" element={<Entrenamiento />} />
          <Route path="/rutina" element={<Rutina />} />
          <Route path="/ejercicios" element={<Ejercicio />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/usuario" element={<Usuario />} />
          <Route path="/ajustes" element={<Ajustes />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
