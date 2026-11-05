import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import { getClientes, restablecerPasswordCliente } from '../services/api.js'

function linkWhatsapp(telefono, texto) {
  let numero = String(telefono || '').replace(/\D/g, '')
  if (!numero) return null
  if (numero.length === 9) numero = `51${numero}`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export default function Clientes() {
  const [q, setQ] = useState('')
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState(null)
  const [temporal, setTemporal] = useState(null) // { cliente, clave }

  useEffect(() => {
    const id = window.setTimeout(() => {
      setCargando(true)
      getClientes(q.trim())
        .then(setLista)
        .catch(() => setToast({ message: 'No se pudieron cargar los clientes', tipo: 'error' }))
        .finally(() => setCargando(false))
    }, 300)
    return () => window.clearTimeout(id)
  }, [q])

  const restablecer = async (cliente) => {
    const ok = window.confirm(
      `¿Generar una clave temporal para ${cliente.nombre}?\n\nSu contraseña actual dejará de funcionar.`
    )
    if (!ok) return
    try {
      const { passwordTemporal } = await restablecerPasswordCliente(cliente.id)
      setTemporal({ cliente, clave: passwordTemporal })
    } catch {
      setToast({ message: 'No se pudo generar la clave temporal', tipo: 'error' })
    }
  }

  const mensaje = temporal
    ? `Hola ${temporal.cliente.nombre}, tu clave temporal de DERON CUTS es: ${temporal.clave}\n` +
      `Entra con tu correo (${temporal.cliente.email}) y cámbiala en "Mi cuenta".`
    : ''

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Mis <span>clientes</span>
              </h1>
              <p className="page-head__sub">
                Si un cliente olvidó su contraseña, genérale una clave temporal y envíasela por WhatsApp.
              </p>
            </div>
          </header>

          <div className="card" style={{ marginBottom: 18 }}>
            <div className="field">
              <label htmlFor="buscar-cliente">Buscar</label>
              <input
                id="buscar-cliente"
                placeholder="Nombre, correo o teléfono"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {temporal && (
            <div className="card clave-temporal">
              <div className="card__title">Clave temporal de {temporal.cliente.nombre}</div>
              <div className="clave-temporal__clave">{temporal.clave}</div>
              <p className="hint">Solo se muestra ahora. Envíasela y pídele que la cambie al entrar.</p>
              <div className="cita__actions">
                {linkWhatsapp(temporal.cliente.telefono, mensaje) && (
                  <a
                    className="btn btn--primary btn--whatsapp"
                    href={linkWhatsapp(temporal.cliente.telefono, mensaje)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enviar por WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(temporal.clave)
                    setToast({ message: 'Clave copiada' })
                  }}
                >
                  Copiar
                </button>
                <button type="button" className="btn btn--outline" onClick={() => setTemporal(null)}>
                  Listo
                </button>
              </div>
            </div>
          )}

          {cargando ? (
            <div className="spinner" />
          ) : lista.length === 0 ? (
            <div className="empty">{q ? 'Ningún cliente coincide' : 'Aún no hay clientes registrados'}</div>
          ) : (
            <div className="card admin-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Acceso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c) => (
                    <tr key={c.id}>
                      <td className="td--principal">
                        <strong>{c.nombre}</strong>
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{c.email}</div>
                      </td>
                      <td data-label="Teléfono">{c.telefono || '—'}</td>
                      <td data-label="Acceso">
                        {[c.tienePassword && 'Contraseña', c.googleVinculado && 'Google'].filter(Boolean).join(' · ') ||
                          '—'}
                      </td>
                      <td className="td--acciones">
                        <div className="row-actions">
                          <button className="btn btn--sm btn--outline" onClick={() => restablecer(c)}>
                            Clave temporal
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}
