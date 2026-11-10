import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import {
  getConfiguracionAdmin,
  actualizarConfiguracion,
  mensajeError,
  subirQrPago,
  resolverImagen
} from '../services/api.js'
import { comprimirImagen } from '../services/imagen.js'
import { MetodoIcono, nombreMetodo, refrescarMetodosPago } from '../components/MetodoPago.jsx'

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
  horario: {},
  recordatoriosActivo: true,
  recordatoriosAntesHoras: 2,
  whatsappActivo: false
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

  const [subiendoQr, setSubiendoQr] = useState(false)

  const cambiarQr = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setSubiendoQr(true)
    try {
      // El QR debe quedar nítido: solo se reduce si es muy pesado.
      const final = archivo.size > 2_500_000 ? await comprimirImagen(archivo, 1400, 0.92) : archivo
      const guardada = await subirQrPago(final)
      setConfig((c) => ({ ...c, qrPagoUrl: guardada.qrPagoUrl }))
      setToast({ message: 'QR actualizado: los clientes ya ven el nuevo' })
    } catch (err) {
      setToast({ message: mensajeError(err, 'No se pudo subir el QR'), tipo: 'error' })
    } finally {
      setSubiendoQr(false)
    }
  }

  const [nuevoMetodo, setNuevoMetodo] = useState('')
  const metodos = config.metodosPago || ['EFECTIVO', 'YAPE', 'PLIN']

  const agregarMetodo = () => {
    const m = nuevoMetodo.trim().replace(/\s+/g, ' ').toUpperCase()
    if (!m) return
    if (metodos.includes(m)) {
      setToast({ message: 'Ese método ya está en la lista', tipo: 'error' })
      return
    }
    setCampo('metodosPago', [...metodos, m])
    setNuevoMetodo('')
  }

  const quitarMetodo = (m) => {
    if (metodos.length <= 1) {
      setToast({ message: 'Deja al menos un método de pago', tipo: 'error' })
      return
    }
    setCampo(
      'metodosPago',
      metodos.filter((x) => x !== m)
    )
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const guardada = await actualizarConfiguracion({ ...config, metodosPago: metodos })
      setConfig(guardada)
      refrescarMetodosPago(guardada.metodosPago)
      setToast({ message: 'Configuración guardada' })
    } catch (err) {
      setToast({ message: mensajeError(err, 'No se pudo guardar la configuración'), tipo: 'error' })
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
            <div className="card__title">Cobro del adelanto al reservar</div>
            <p className="page-head__sub" style={{ marginBottom: 14 }}>
              Los clientes ven este QR y número al reservar, pagan el 50% y suben la captura. Tú lo verificas en
              Citas con "Verificar pago".
            </p>
            <div className="cobro-config">
              <div className="cobro-config__qr">
                {config.qrPagoUrl && <img src={resolverImagen(config.qrPagoUrl)} alt="QR de pago" />}
                <label className="btn btn--outline btn--sm">
                  {subiendoQr ? 'Subiendo…' : 'Cambiar QR'}
                  <input type="file" accept="image/*" hidden onChange={cambiarQr} disabled={subiendoQr} />
                </label>
              </div>
              <div className="form-grid" style={{ flex: 1 }}>
                <div className="field">
                  <label htmlFor="cfg-yape">Número de Yape / Plin</label>
                  <input
                    id="cfg-yape"
                    inputMode="tel"
                    value={config.yapeNumero || ''}
                    onChange={(e) => setCampo('yapeNumero', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cfg-titular">Nombre del titular (lo ve el cliente al yapear)</label>
                  <input
                    id="cfg-titular"
                    placeholder="Ej.: Yumpi D."
                    value={config.yapeTitular || ''}
                    onChange={(e) => setCampo('yapeTitular', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cfg-correo-rep">Correo para el reporte semanal (PDF)</label>
                  <input
                    id="cfg-correo-rep"
                    type="email"
                    placeholder="tucorreo@gmail.com"
                    value={config.correoReportes || ''}
                    onChange={(e) => setCampo('correoReportes', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__title">Métodos de pago</div>
            <p className="page-head__sub" style={{ marginBottom: 14 }}>
              Estos aparecen al registrar un adelanto o un cobro. Agrega los que uses (por ejemplo
              BIM o Tarjeta) y quita los que no. Pulsa Guardar arriba para aplicar.
            </p>
            <div className="metodos-config">
              {metodos.map((m) => (
                <div className="metodo-chip" key={m}>
                  <MetodoIcono metodo={m} tamano={34} />
                  <span>{nombreMetodo(m)}</span>
                  <button
                    type="button"
                    className="metodo-chip__quitar"
                    aria-label={`Quitar ${nombreMetodo(m)}`}
                    onClick={() => quitarMetodo(m)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="metodo-agregar">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="nuevo-metodo">Nuevo método</label>
                <input
                  id="nuevo-metodo"
                  placeholder="Ej.: BIM, Tarjeta, Transferencia"
                  maxLength={30}
                  value={nuevoMetodo}
                  onChange={(e) => setNuevoMetodo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      agregarMetodo()
                    }
                  }}
                />
              </div>
              <button type="button" className="btn btn--outline" onClick={agregarMetodo}>
                + Agregar
              </button>
            </div>
          </div>

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

          <div className="card" style={{ marginTop: 18 }}>
            <div className="card__title">Recordatorios y notificaciones</div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="field">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!config.recordatoriosActivo}
                    onChange={(e) => setCampo('recordatoriosActivo', e.target.checked)}
                  />
                  Activar avisos automáticos
                </label>
                <div className="hint">
                  Aviso al instante (con sonido) en el panel cuando hay una cita nueva,
                  reprogramada o cancelada.
                </div>
              </div>
              <div className="field">
                <label>Recordar al cliente con horas de anticipación</label>
                <select
                  value={config.recordatoriosAntesHoras ?? 2}
                  onChange={(e) => setCampo('recordatoriosAntesHoras', Number(e.target.value))}
                >
                  <option value={1}>1 hora antes</option>
                  <option value={2}>2 horas antes</option>
                  <option value={3}>3 horas antes</option>
                  <option value={6}>6 horas antes</option>
                  <option value={12}>12 horas antes</option>
                  <option value={24}>1 día antes</option>
                  <option value={48}>2 días antes</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!config.whatsappActivo}
                    onChange={(e) => setCampo('whatsappActivo', e.target.checked)}
                  />
                  Enviar recordatorios por WhatsApp
                </label>
                <div className="hint">
                  Requiere conectar la integración de Meta WhatsApp. Mientras tanto los
                  recordatorios de WhatsApp quedan en cola en la sección Recordatorios.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}