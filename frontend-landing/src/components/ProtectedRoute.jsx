import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { cliente, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="booking container">
        <div className="spinner" />
      </div>
    )
  }

  if (!cliente) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
