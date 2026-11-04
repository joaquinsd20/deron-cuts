import { Routes, Route } from 'react-router-dom'
import Home from './views/Home.jsx'
import Booking from './views/Booking.jsx'
import Login from './views/Login.jsx'
import Cuenta from './views/Cuenta.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import FloatingActions from './components/FloatingActions.jsx'
import LoadingCookie from './components/LoadingCookie.jsx'

export default function App() {
  return (
    <>
      <LoadingCookie />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/reservar"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/cuenta"
          element={
            <ProtectedRoute>
              <Cuenta />
            </ProtectedRoute>
          }
        />
      </Routes>
      <FloatingActions />
    </>
  )
}
