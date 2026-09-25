import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
})

export function getConfiguracion() {
  return api.get('/api/public/configuracion').then((r) => r.data)
}

export function getServicios() {
  return api.get('/api/public/servicios').then((r) => r.data)
}

export function getDisponibilidad(fecha, servicioId) {
  return api
    .get('/api/public/disponibilidad', { params: { fecha, servicioId } })
    .then((r) => r.data)
}

export function crearCita(payload) {
  return api.post('/api/public/citas', payload).then((r) => r.data)
}