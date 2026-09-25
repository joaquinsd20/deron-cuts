import { Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './services/auth.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginView from './views/LoginView.jsx'
import Dashboard from './views/Dashboard.jsx'
import Calendario from './views/Calendario.jsx'
import CitasManager from './views/CitasManager.jsx'
import CatalogoManager from './views/CatalogoManager.jsx'
import Pagos from './views/Pagos.jsx'
import ConfiguracionView from './views/ConfiguracionView.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendario"
        element={
          <ProtectedRoute>
            <Calendario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citas"
        element={
          <ProtectedRoute>
            <CitasManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/servicios"
        element={
          <ProtectedRoute>
            <CatalogoManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagos"
        element={
          <ProtectedRoute>
            <Pagos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <ConfiguracionView />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={auth.isAuth() ? '/' : '/login'} replace />} />
    </Routes>
  )
}