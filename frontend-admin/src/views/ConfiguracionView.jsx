import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import { getConfiguracionAdmin, actualizarConfiguracion } from '../services/api.js'

const DIAS = [
  ['LUNES', 'Lunes'],
  ['MARTES', 'Martes'],
  ['MIERCOLES', 'Miércoles'],
  ['JUEVES', 'Jueves'],
  ['VIERNES', 'Viernes'],
  ['SABADO', 'Sábado'],
  ['DOMINGO', 'Domingo']
]

const VACIO = {
  nombreNegocio: '',
  nombreBarbero: '',
  telefono: '',
  email: '',
  direccion: '',
  enlaceMapa: '',
  instagram: '',
  tiktok: '',
  descripcionBarbero: '',
  horario: {}
}

export default function ConfiguracionView() {
  const [config, setConfig] = useState(VACIO)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getConfiguracionAdmin()
      .then(setConfig)
      .catch(() => setToast({ message: 'No se pudo cargar la configuración', tipo: 'error' }))
      .finally(() => setCargando(false))
  }, [])

  const setCampo = (campo, valor) => setConfig((c) => ({ ...c, [campo]: valor }))

  const setDia = (clave, campo, valor) =>
    setConfig((c) => ({
      ...c,
      horario: {
        ...c.horario,
        [clave]: {
          abre: '10:00',
          cierra: '20:00',
          activo: true,
          ...(c.horario[clave] || {}),
          [campo]: valor
        }
      }
    }))

  const guardar = async () => {
    setGuardando(true)
    try {
      await actualizarConfiguracion(config)
      setToast({ message: 'Configuración guardada' })
    } catch {
      setToast({ message: 'No se pudo guardar la configuración', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="admin">
        <Sidebar />
        <main className="main">
          <div className="spinner" />
        </main>
      </div>
    )
  }

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Configuración del <span>negocio</span>
              </h1>
            </div>
            <button className="btn btn--primary" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </header>

          <div className="card">
            <div className="card__title">Datos del negocio</div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="field">
                <label>Nombre del negocio</label>
                <input
                  value={config.nombreNegocio}
                  onChange={(e) => setCampo('nombreNegocio', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Nombre del barbero</label>
                <input
                  value={config.nombreBarbero}
                  onChange={(e) => setCampo('nombreBarbero', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Teléfono / WhatsApp</label>
                <input
                  value={config.telefono}
                  onChange={(e) => setCampo('telefono', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  value={config.email}
                  onChange={(e) => setCampo('email', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Instagram</label>
                <input
                  value={config.instagram}
                  onChange={(e) => setCampo('instagram', e.target.value)}
                />
              </div>
              <div className="field">
                <label>TikTok</label>
                <input
                  value={config.tiktok}
                  onChange={(e) => setCampo('tiktok', e.target.value)}
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label>Dirección</label>
              <input
                value={config.direccion}
                onChange={(e) => setCampo('direccion', e.target.value)}
              />
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label>Enlace de mapa (Google Maps)</label>
              <input
                value={config.enlaceMapa}
                onChange={(e) => setCampo('enlaceMapa', e.target.value)}
              />
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label>Descripción del barbero</label>
              <textarea
                rows={4}
                value={config.descripcionBarbero}
                onChange={(e) => setCampo('descripcionBarbero', e.target.value)}
              />
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="card__title">Horario de atención</div>
            <div className="horario-grid">
              {DIAS.map(([clave, nombre]) => {
                const dia = config.horario[clave] || { abre: '10:00', cierra: '20:00', activo: false }
                return (
                  <div className="horario-day" key={clave}>
                    <h4>{nombre}</h4>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={dia.activo}
                        onChange={(e) => setDia(clave, 'activo', e.target.checked)}
                      />
                      Abierto
                    </label>
                    <input
                      type="time"
                      value={dia.abre}
                      disabled={!dia.activo}
                      onChange={(e) => setDia(clave, 'abre', e.target.value)}
                    />
                    <input
                      type="time"
                      value={dia.cierra}
                      disabled={!dia.activo}
                      onChange={(e) => setDia(clave, 'cierra', e.target.value)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} />
    </div>
  )
}