import axios from 'axios'
import { auth } from './auth.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
})

api.interceptors.request.use((config) => {
  const token = auth.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      auth.clear()
      const { pathname } = window.location
      if (!pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export function login(username, password) {
  return api.post('/api/auth/login', { username, password }).then((r) => r.data)
}

export function getCitas(filters = {}) {
  return api.get('/api/admin/citas', { params: filters }).then((r) => r.data)
}

export function getResumen() {
  return api.get('/api/admin/citas/resumen').then((r) => r.data)
}

export function cambiarEstadoCita(citaId, estado) {
  return api.patch(`/api/admin/citas/${citaId}/estado`, { estado }).then((r) => r.data)
}

export function reprogramarCita(citaId, fechaHoraInicio) {
  return api.put(`/api/admin/citas/${citaId}`, { fechaHoraInicio }).then((r) => r.data)
}

export function registrarPagoCita(citaId, payload) {
  return api.post(`/api/admin/citas/${citaId}/pago`, payload).then((r) => r.data)
}

export function getResumenPagos() {
  return api.get('/api/admin/pagos/resumen').then((r) => r.data)
}

export function getPagos(params = {}) {
  return api.get('/api/admin/pagos', { params }).then((r) => r.data)
}

export function getServicios() {
  return api.get('/api/admin/servicios').then((r) => r.data)
}

export function crearServicio(payload) {
  return api.post('/api/admin/servicios', payload).then((r) => r.data)
}

export function actualizarServicio(id, payload) {
  return api.put(`/api/admin/servicios/${id}`, payload).then((r) => r.data)
}

export function cambiarActivoServicio(id, activo) {
  return api.patch(`/api/admin/servicios/${id}/activo`, null, { params: { activo } }).then((r) => r.data)
}

export function eliminarServicio(id) {
  return api.delete(`/api/admin/servicios/${id}`).then((r) => r.data)
}

export function getConfiguracionAdmin() {
  return api.get('/api/admin/configuracion').then((r) => r.data)
}

export function actualizarConfiguracion(payload) {
  return api.put('/api/admin/configuracion', payload).then((r) => r.data)
}