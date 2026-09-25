import { Navigate } from 'react-router-dom'
import { auth } from '../services/auth.js'

export default function ProtectedRoute({ children }) {
  if (!auth.isAuth()) {
    return <Navigate to="/login" replace />
  }
  return children
}