import { formatMoney, formatHora } from '../services/format.js'

const METODO_LABEL = {
  EFECTIVO: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia'
}

export default function AppointmentCard({ cita, onEstado, onReprogramar, onRegistrarPago }) {
  const telNumerico = (cita.telefonoWhatsapp || '').replace(/\D/g, '')
  const estado = (cita.estado || '').toUpperCase()

  return (
    <article className={`cita cita--${estado.toLowerCase()}`}>
      <div className="cita__time">{formatHora(cita.fechaHoraInicio)}</div>

      <div className="cita__body">
        <div className="cita__cliente">{cita.nombreCliente}</div>
        <div className="cita__meta">
          <span className={`badge badge--${estado}`}>{estado}</span>
          {' \u00b7 '}
          {cita.nombreServicio} · {formatMoney(cita.precioServicio)} · {cita.duracionMinutos} min
          {cita.pagada && (
            <>
              {' · '}
              <span className="badge badge--pago">
                PAGADO {formatMoney(cita.montoPagado)} · {METODO_LABEL[cita.metodoPago] || cita.metodoPago}
              </span>
            </>
          )}
        </div>
        <div className="cita__meta">
          {cita.email ? (
            <a href={`mailto:${cita.email}`}>{cita.email}</a>
          ) : (
            'Sin correo'
          )}
          {telNumerico && (
            <>
              {' · '}
              <a
                href={`https://wa.me/${telNumerico}`}
                target="_blank"
                rel="noreferrer"
              >
                {cita.telefonoWhatsapp}
              </a>
            </>
          )}
        </div>
        {cita.notas && <div className="cita__notas">{cita.notas}</div>}
      </div>

      <div className="cita__actions">
        {estado === 'PENDIENTE' && (
          <button className="btn btn--sm" onClick={() => onEstado('CONFIRMADA')}>
            Confirmar
          </button>
        )}
        {estado === 'CONFIRMADA' && (
          <>
            <button className="btn btn--sm" onClick={() => onEstado('COMPLETADA')}>
              Completar
            </button>
            <button
              className="btn btn--sm btn--outline"
              onClick={() => onEstado('PENDIENTE')}
            >
              Reabrir
            </button>
          </>
        )}
        {!cita.pagada &&
          (estado === 'CONFIRMADA' || estado === 'COMPLETADA') &&
          onRegistrarPago && (
            <button className="btn btn--sm btn--pago" onClick={() => onRegistrarPago(cita)}>
              Cobrar
            </button>
          )}
        {estado === 'CANCELADA' && cita.pagada && (
          <span className="badge badge--pago">Devolver {formatMoney(cita.montoPagado)}</span>
        )}
        {estado === 'PENDIENTE' && (
          <button className="btn btn--sm btn--danger" onClick={() => onEstado('CANCELADA')}>
            Cancelar
          </button>
        )}
        {onReprogramar &&
          (estado === 'PENDIENTE' || estado === 'CONFIRMADA') && (
            <button className="btn btn--sm btn--outline" onClick={() => onReprogramar(cita)}>
              Reprogramar
            </button>
          )}
      </div>
    </article>
  )
}