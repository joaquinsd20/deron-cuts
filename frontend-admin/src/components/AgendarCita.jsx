import { useEffect, useMemo, useState } from 'react'
import {
  getClientes,
  getServicios,
  getDisponibilidad,
  crearCitaAdmin,
  crearClienteExterno,
  mensajeError
} from '../services/api.js'
import { fechaLocal, formatMoney } from '../services/format.js'
import { MetodoSelector, useMetodosPago } from './MetodoPago.jsx'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** Ventana para que el barbero agende una cita (llamada, WhatsApp o cliente en persona). */
export default function AgendarCita({ onCerrar, onCreada, avisar }) {
  const metodos = useMetodosPago()
  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [modo, setModo] = useState('existente') // existente | nuevo | paso
  const [busca, setBusca] = useState('')
  const [clienteId, setClienteId] = useState(null)
  const [nuevo, setNuevo] = useState({ nombre: '', telefono: '', email: '', fechaNacimiento: '' })
  const [servicioId, setServicioId] = useState(null)
  const [fecha, setFecha] = useState(fechaLocal())
  const [horarios, setHorarios] = useState([])
  const [cargandoHoras, setCargandoHoras] = useState(false)
  const [hora, setHora] = useState(null)
  const [notas, setNotas] = useState('')
  const [pago, setPago] = useState('pendiente') // pendiente | pagado | confirmar
  const [metodo, setMetodo] = useState('YAPE')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    getClientes().then(setClientes).catch(() => {})
    getServicios()
      .then((s) => {
        const activos = s.filter((x) => x.activo)
        setServicios(activos)
        if (activos[0]) setServicioId(activos[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!metodos.includes(metodo)) setMetodo(metodos[0])
  }, [metodos, metodo])

  useEffect(() => {
    if (!servicioId || !fecha) return
    setCargandoHoras(true)
    setHora(null)
    getDisponibilidad(fecha, servicioId)
      .then((r) => setHorarios(r.horarios || []))
      .catch(() => setHorarios([]))
      .finally(() => setCargandoHoras(false))
  }, [servicioId, fecha])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const lista = q
      ? clientes.filter((c) =>
          [c.nombre, c.telefono, c.email].some((v) => String(v || '').toLowerCase().includes(q))
        )
      : clientes
    return lista.slice(0, 8)
  }, [clientes, busca])

  const dias = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d
      }),
    []
  )

  const servicio = servicios.find((s) => s.id === servicioId)
  const elegido = clientes.find((c) => c.id === clienteId)

  const guardar = async () => {
    if (!hora) return avisar({ message: 'Elige un horario', tipo: 'error' })
    setEnviando(true)
    try {
      let idCliente = modo === 'existente' ? clienteId : null
      let nombre = elegido?.nombre
      let telefono = elegido?.telefono
      if (modo === 'existente' && !idCliente) throw new Error('Elige un cliente de la lista')
      if (modo === 'nuevo') {
        const creado = await crearClienteExterno({
          nombre: nuevo.nombre,
          telefono: nuevo.telefono,
          email: nuevo.email || null,
          fechaNacimiento: nuevo.fechaNacimiento || null
        })
        idCliente = creado.id
        nombre = creado.nombre
        telefono = creado.telefono
      }
      if (modo === 'paso') {
        nombre = nuevo.nombre
        telefono = nuevo.telefono
      }
      const cita = await crearCitaAdmin({
        servicioId,
        clienteId: idCliente,
        nombreCliente: nombre,
        telefonoWhatsapp: telefono,
        notas: notas.trim() || null,
        fechaHoraInicio: `${fecha}T${hora}:00`,
        adelantoPagado: pago === 'pagado',
        metodoAdelanto: pago === 'pagado' ? metodo : null,
        confirmar: pago === 'confirmar'
      })
      avisar({ message: `Cita agendada: ${cita.nombreCliente} · ${hora}` })
      onCreada?.(cita)
      onCerrar()
    } catch (err) {
      avisar({ message: mensajeError(err, err?.message || 'No se pudo agendar la cita'), tipo: 'error' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal" role="presentation" onClick={() => !enviando && onCerrar()}>
      <div className="modal__panel modal__panel--ancho" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="card__title">Agendar cita</div>

        <div className="segmentos" role="tablist">
          {[
            ['existente', 'Cliente registrado'],
            ['nuevo', 'Cliente nuevo'],
            ['paso', 'De paso']
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`segmento${modo === k ? ' segmento--activo' : ''}`}
              onClick={() => setModo(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {modo === 'existente' && (
          <div className="field">
            <label htmlFor="ag-busca">Buscar cliente</label>
            <input
              id="ag-busca"
              placeholder="Nombre o teléfono"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="lista-elegir">
              {filtrados.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`elegir${clienteId === c.id ? ' elegir--activo' : ''}`}
                  onClick={() => setClienteId(c.id)}
                >
                  <strong>{c.nombre}</strong>
                  <span>{c.telefono}</span>
                </button>
              ))}
              {filtrados.length === 0 && <span className="hint">Sin resultados. Usa "Cliente nuevo".</span>}
            </div>
          </div>
        )}

        {(modo === 'nuevo' || modo === 'paso') && (
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="field">
              <label htmlFor="ag-nombre">Nombre</label>
              <input id="ag-nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="ag-tel">Teléfono / WhatsApp</label>
              <input
                id="ag-tel"
                inputMode="tel"
                value={nuevo.telefono}
                onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
              />
            </div>
            {modo === 'nuevo' && (
              <>
                <div className="field">
                  <label htmlFor="ag-email">Correo (opcional)</label>
                  <input
                    id="ag-email"
                    type="email"
                    value={nuevo.email}
                    onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ag-cumple">Cumpleaños (opcional)</label>
                  <input
                    id="ag-cumple"
                    type="date"
                    value={nuevo.fechaNacimiento}
                    onChange={(e) => setNuevo({ ...nuevo, fechaNacimiento: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        )}
        {modo === 'paso' && <p className="hint">No se guarda en Clientes; solo queda en la cita.</p>}

        <div className="field">
          <label htmlFor="ag-servicio">Servicio</label>
          <select id="ag-servicio" value={servicioId || ''} onChange={(e) => setServicioId(Number(e.target.value))}>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} · {formatMoney(s.precio)} · {s.duracionMinutos} min
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Día</label>
          <div className="dias-scroll">
            {dias.map((d) => {
              const iso = fechaLocal(d)
              return (
                <button
                  type="button"
                  key={iso}
                  className={`dia${fecha === iso ? ' dia--activo' : ''}`}
                  onClick={() => setFecha(iso)}
                >
                  <span>{DIAS[d.getDay()]}</span>
                  <strong>{d.getDate()}</strong>
                </button>
              )
            })}
          </div>
        </div>

        <div className="field">
          <label>Hora</label>
          {cargandoHoras ? (
            <span className="hint">Buscando horarios libres…</span>
          ) : horarios.length === 0 ? (
            <span className="hint">No hay horarios libres ese día (cerrado o lleno).</span>
          ) : (
            <div className="horas">
              {horarios.map((h) => (
                <button
                  type="button"
                  key={h}
                  className={`hora${hora === h ? ' hora--activa' : ''}`}
                  onClick={() => setHora(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label>Adelanto {servicio ? `(${formatMoney(Number(servicio.precio) / 2)})` : ''}</label>
          <div className="segmentos">
            {[
              ['pendiente', 'Pendiente'],
              ['pagado', 'Ya lo pagó'],
              ['confirmar', 'Confirmar sin adelanto']
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`segmento${pago === k ? ' segmento--activo' : ''}`}
                onClick={() => setPago(k)}
              >
                {label}
              </button>
            ))}
          </div>
          {pago === 'pagado' && (
            <div style={{ marginTop: 10 }}>
              <MetodoSelector valor={metodo} onChange={setMetodo} metodos={metodos} />
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="ag-notas">Notas (opcional)</label>
          <textarea id="ag-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>

        <div className="modal__acciones">
          <button type="button" className="btn btn--primary" onClick={guardar} disabled={enviando || !hora}>
            {enviando ? 'Agendando…' : hora ? `Agendar a las ${hora}` : 'Elige un horario'}
          </button>
          <button type="button" className="btn btn--outline" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
