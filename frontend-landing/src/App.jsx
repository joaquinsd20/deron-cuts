import { Routes, Route } from 'react-router-dom'
import Home from './views/Home.jsx'
import Booking from './views/Booking.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reservar" element={<Booking />} />
    </Routes>
  )
}