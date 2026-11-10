import axios from 'axios'
import { clienteAuth } from './clienteAuth.js'
import { beginLoading, endLoading } from '../lib/loading.js'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
})

api.interceptors.request.use((config) => {
  beginLoading()
  const token = clienteAuth.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    endLoading()
    return res
  },
  (err) => {
    endLoading()
    if (err?.response?.status === 401 && String(err?.config?.url || '').startsWith('/api/cliente')) {
      clienteAuth.clear()
    }
    return Promise.reject(err)
  }
)

// Fotos subidas desde el admin se sirven desde el backend (/api/...).
export function resolverImagen(url) {
  if (!url) return null
  if (url.startsWith('/api/')) return `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}${url}`
  return url
}

export function cambiarPassword(actual, nueva) {
  return api.put('/api/cliente/password', { actual, nueva })
}

export function reportarPago(citaId, payload) {
  return api.post(`/api/cliente/citas/${citaId}/pago`, payload).then((r) => r.data)
}

export function cancelarCita(id) {
  return api.patch(`/api/cliente/citas/${id}/cancelar`).then((r) => r.data)
}

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

export function registrarCliente(payload) {
  return api.post('/api/auth/cliente/registro', payload).then((r) => r.data)
}

export function loginCliente(payload) {
  return api.post('/api/auth/cliente/login', payload).then((r) => r.data)
}

export function loginClienteGoogle(payload) {
  return api.post('/api/auth/cliente/google', payload).then((r) => r.data)
}

export function getPerfilCliente() {
  return api.get('/api/cliente/perfil').then((r) => r.data)
}

export function getMisCitas() {
  return api.get('/api/cliente/citas').then((r) => r.data)
}

export function crearCita(payload) {
  return api.post('/api/cliente/citas', payload).then((r) => r.data)
}
