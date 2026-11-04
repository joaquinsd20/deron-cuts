import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './views/Home.jsx'
import Booking from './views/Booking.jsx'
import Login from './views/Login.jsx'
import Cuenta from './views/Cuenta.jsx'
import Privacidad from './views/Privacidad.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import FloatingActions from './components/FloatingActions.jsx'
import LoadingCookie from './components/LoadingCookie.jsx'
import { beginLoading, endLoading } from './lib/loading.js'

function RouteLoader() {
  const location = useLocation()
  useEffect(() => {
    beginLoading()
    const timer = window.setTimeout(() => endLoading(), 600)
    return () => {
      window.clearTimeout(timer)
      endLoading()
    }
  }, [location.pathname, location.search])
  return null
}

export default function App() {
  return (
    <>
      <LoadingCookie />
      <RouteLoader />
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
        <Route path="/privacidad" element={<Privacidad />} />
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
