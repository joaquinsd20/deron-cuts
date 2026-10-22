import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clienteAuth } from '../services/clienteAuth.js'
import {
  getPerfilCliente,
  loginCliente,
  loginClienteGoogle,
  registrarCliente
} from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [cliente, setCliente] = useState(null)
  const [cargando, setCargando] = useState(true)

  const guardarSesion = useCallback((respuesta) => {
    clienteAuth.save(respuesta.token)
    setCliente(respuesta.cliente)
    return respuesta.cliente
  }, [])

  useEffect(() => {
    if (!clienteAuth.getToken()) {
      setCargando(false)
      return
    }
    getPerfilCliente()
      .then(setCliente)
      .catch(() => {
        clienteAuth.clear()
        setCliente(null)
      })
      .finally(() => setCargando(false))
  }, [])

  const iniciarSesion = useCallback(
    async (payload) => guardarSesion(await loginCliente(payload)),
    [guardarSesion]
  )

  const registrarse = useCallback(
    async (payload) => guardarSesion(await registrarCliente(payload)),
    [guardarSesion]
  )

  const entrarConGoogle = useCallback(
    async (payload) => guardarSesion(await loginClienteGoogle(payload)),
    [guardarSesion]
  )

  const cerrarSesion = useCallback(() => {
    clienteAuth.clear()
    setCliente(null)
  }, [])

  const refrescar = useCallback(async () => {
    if (!clienteAuth.getToken()) return null
    const perfil = await getPerfilCliente()
    setCliente(perfil)
    return perfil
  }, [])

  return (
    <AuthContext.Provider
      value={{
        cliente,
        cargando,
        iniciarSesion,
        registrarse,
        entrarConGoogle,
        cerrarSesion,
        refrescar
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return contexto
}
