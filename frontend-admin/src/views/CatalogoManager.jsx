import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import {
  getServicios,
  crearServicio,
  actualizarServicio,
  cambiarActivoServicio,
  eliminarServicio
} from '../services/api.js'
import { formatMoney } from '../services/format.js'

const VACIO = {
  id: null,
  nombre: '',
  descripcion: '',
  precio: '',
  duracionMinutos: '',
  imagenUrl: ''
}

export default function CatalogoManager() {
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(VACIO)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setServicios(await getServicios())
    } catch {
      setToast({ message: 'No se pudieron cargar los servicios', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const abrirNuevo = () => {
    setForm(VACIO)
    setEditando(true)
  }

  const abrirEditar = (s) => {
    setForm({ ...s, precio: String(s.precio), duracionMinutos: String(s.duracionMinutos) })
    setEditando(true)
  }

  const guardar = async () => {
    setGuardando(true)
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      duracionMinutos: Number(form.duracionMinutos),
      imagenUrl: form.imagenUrl.trim()
    }
    try {
      if (form.id) {
        await actualizarServicio(form.id, payload)
        setToast({ message: 'Servicio actualizado' })
      } else {
        await crearServicio(payload)
        setToast({ message: 'Servicio creado' })
      }
      setEditando(false)
      setForm(VACIO)
      await cargar()
    } catch {
      setToast({ message: 'No se pudo guardar el servicio', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async (s) => {
    try {
      await cambiarActivoServicio(s.id, !s.activo)
      await cargar()
    } catch {
      setToast({ message: 'No se pudo cambiar el estado', tipo: 'error' })
    }
  }

  const eliminar = async (s) => {
    if (!window.confirm(`¿Desactivar «${s.nombre}»?`)) return
    try {
      await eliminarServicio(s.id)
      setToast({ message: 'Servicio desactivado' })
      await cargar()
    } catch {
      setToast({ message: 'No se pudo desactivar el servicio', tipo: 'error' })
    }
  }

  const visibles = servicios

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Catálogo de <span>servicios</span>
              </h1>
            </div>
            {!editando && (
              <button className="btn btn--primary" onClick={abrirNuevo}>
                + Nuevo servicio
              </button>
            )}
          </header>

          {editando && (
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="card__title">{form.id ? 'Editar servicio' : 'Nuevo servicio'}</div>
              <div className="form-grid">
                <div className="field">
                  <label>
                    Nombre <span className="req">*</span>
                  </label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setCampo('nombre', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>
                    Descripción <span className="req">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.descripcion}
                    onChange={(e) => setCampo('descripcion', e.target.value)}
                  />
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="field">
                    <label>
                      Precio (MXN) <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precio}
                      onChange={(e) => setCampo('precio', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>
                      Duración (min) <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="5"
                      value={form.duracionMinutos}
                      onChange={(e) => setCampo('duracionMinutos', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>URL de imagen</label>
                    <input
                      value={form.imagenUrl}
                      onChange={(e) => setCampo('imagenUrl', e.target.value)}
                    />
                  </div>
                </div>
                <div className="cita__actions">
                  <button className="btn btn--primary btn--sm" onClick={guardar} disabled={guardando}>
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button className="btn btn--outline btn--sm" onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {cargando ? (
            <div className="spinner" />
          ) : visibles.length === 0 ? (
            <div className="empty">Aún no hay servicios registrados</div>
          ) : (
            <div className="card admin-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Precio</th>
                    <th>Duración</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.nombre}</strong>
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{s.descripcion}</div>
                      </td>
                      <td>{formatMoney(s.precio)}</td>
                      <td>{s.duracionMinutos} min</td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={s.activo}
                            onChange={() => toggleActivo(s)}
                          />
                          {s.activo ? 'Sí' : 'No'}
                        </label>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn--sm btn--outline" onClick={() => abrirEditar(s)}>
                            Editar
                          </button>
                          {s.activo && (
                            <button className="btn btn--sm btn--danger" onClick={() => eliminar(s)}>
                              Desactivar
                            </button>
                          )}
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
      <Toast message={toast?.message} tipo={toast?.tipo} />
    </div>
  )
}