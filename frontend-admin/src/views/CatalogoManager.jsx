import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import {
  getServicios,
  crearServicio,
  actualizarServicio,
  cambiarActivoServicio,
  eliminarServicio,
  subirImagenServicio,
  resolverImagen
} from '../services/api.js'
import { formatMoney } from '../services/format.js'
import { comprimirImagen } from '../services/imagen.js'

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
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)

  const elegirArchivo = async (e) => {
    const original = e.target.files?.[0]
    e.target.value = ''
    if (!original) return
    if (!original.type.startsWith('image/')) {
      setToast({ message: 'Elige un archivo de imagen', tipo: 'error' })
      return
    }
    try {
      const comprimido = await comprimirImagen(original)
      setArchivo(comprimido)
      setPreview(URL.createObjectURL(comprimido))
    } catch {
      setToast({ message: 'No se pudo leer la imagen', tipo: 'error' })
    }
  }

  const limpiarFoto = () => {
    setArchivo(null)
    setPreview(null)
  }

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
    limpiarFoto()
    setEditando(true)
  }

  const abrirEditar = (s) => {
    setForm({
      ...s,
      precio: String(s.precio),
      duracionMinutos: String(s.duracionMinutos),
      imagenUrl: s.imagenUrl || ''
    })
    limpiarFoto()
    setEditando(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardar = async () => {
    setGuardando(true)
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      duracionMinutos: Number(form.duracionMinutos),
      imagenUrl: (form.imagenUrl || '').trim() || null,
      activo: form.id ? form.activo !== false : true
    }
    try {
      const guardado = form.id
        ? await actualizarServicio(form.id, payload)
        : await crearServicio(payload)
      if (archivo) {
        await subirImagenServicio(guardado.id, archivo)
      }
      setToast({ message: form.id ? 'Servicio actualizado' : 'Servicio creado' })
      setEditando(false)
      setForm(VACIO)
      limpiarFoto()
      await cargar()
    } catch (err) {
      const msg = err?.response?.data?.message
      setToast({ message: msg || 'No se pudo guardar el servicio', tipo: 'error' })
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
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="field">
                    <label>
                      Precio (S/) <span className="req">*</span>
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
                </div>
                <div className="field">
                  <label>Foto del corte</label>
                  <div className="foto-picker">
                    {preview || form.imagenUrl ? (
                      <img
                        className="foto-picker__img"
                        src={preview || resolverImagen(form.imagenUrl)}
                        alt="Vista previa"
                      />
                    ) : (
                      <div className="foto-picker__vacio">Sin foto</div>
                    )}
                    <div className="foto-picker__acciones">
                      <label className="btn btn--outline btn--sm">
                        {preview || form.imagenUrl ? 'Cambiar foto' : 'Subir foto'}
                        <input type="file" accept="image/*" hidden onChange={elegirArchivo} />
                      </label>
                      {(preview || form.imagenUrl) && (
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => {
                            limpiarFoto()
                            setCampo('imagenUrl', '')
                          }}
                        >
                          Quitar foto
                        </button>
                      )}
                      <span className="hint">JPG o PNG. Se ajusta automáticamente.</span>
                    </div>
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
                        <div className="servicio-celda">
                          {s.imagenUrl ? (
                            <img className="servicio-celda__img" src={resolverImagen(s.imagenUrl)} alt="" />
                          ) : (
                            <div className="servicio-celda__img servicio-celda__img--vacia">✂</div>
                          )}
                          <div>
                            <strong>{s.nombre}</strong>
                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{s.descripcion}</div>
                          </div>
                        </div>
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
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}