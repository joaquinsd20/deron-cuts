import { formatMoney, formatHora } from '../services/format.js'

const METODO_LABEL = {
  EFECTIVO: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia'
}

export default function AppointmentCard({
  cita,
  onEstado,
  onReprogramar,
  onRegistrarPago,
  onAdelanto,
  onTardanza,
  onEliminar
}) {
  const telNumerico = (cita.telefonoWhatsapp || '').replace(/\D/g, '')
  const estado = (cita.estado || '').toUpperCase()
  const precio = Number(cita.precioFinal ?? cita.precioServicio ?? 0)
  const adelanto = Number(cita.adelantoMonto ?? 0)
  const requiereAdelanto = adelanto > 0
  const saldo = Number(cita.saldoPendiente ?? 0)
  const abierta = estado === 'PENDIENTE' || estado === 'CONFIRMADA'

  return (
    <article className={`cita cita--${estado.toLowerCase()}`}>
      <div className="cita__time">{formatHora(cita.fechaHoraInicio)}</div>

      <div className="cita__body">
        <div className="cita__cliente">{cita.nombreCliente}</div>
        <div className="cita__meta">
          <span className={`badge badge--${estado}`}>{estado}</span>
          {' \u00b7 '}
          {cita.nombreServicio} · {cita.duracionMinutos} min
          {cita.descuentoCumpleanos && (
            <>
              {' · '}
              <span className="badge badge--cumple">CUMPLEAÑOS GRATIS</span>
            </>
          )}
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
        <div className="cita__meta">
          Precio {formatMoney(precio)} · Total {formatMoney(cita.totalAPagar)} · Saldo{' '}
          <b>{formatMoney(saldo)}</b>
          {requiereAdelanto && (
            <>
              {' · '}
              {cita.adelantoPagado ? (
                <span className="badge badge--adelanto">
                  ADELANTO {formatMoney(adelanto)}
                  {cita.metodoAdelanto
                    ? ` · ${METODO_LABEL[cita.metodoAdelanto] || cita.metodoAdelanto}`
                    : ''}
                </span>
              ) : (
                <span className="badge badge--adelanto-pend">
                  ADELANTO PENDIENTE {formatMoney(adelanto)}
                </span>
              )}
            </>
          )}
          {cita.tardanzaAplicada && (
            <>
              {' · '}
              <span className="badge badge--tardanza">
                TARDANZA +{formatMoney(cita.penalidadTardanza)}
              </span>
            </>
          )}
        </div>
        {cita.notas && <div className="cita__notas">{cita.notas}</div>}
      </div>

      <div className="cita__actions">
        {estado === 'PENDIENTE' && (!requiereAdelanto || cita.adelantoPagado) && (
          <button className="btn btn--sm" onClick={() => onEstado(cita.id, 'CONFIRMADA')}>
            Confirmar
          </button>
        )}
        {estado === 'CONFIRMADA' && (
          <>
            <button className="btn btn--sm" onClick={() => onEstado(cita.id, 'COMPLETADA')}>
              Completar
            </button>
            <button
              className="btn btn--sm btn--outline"
              onClick={() => onEstado(cita.id, 'PENDIENTE')}
            >
              Reabrir
            </button>
          </>
        )}
        {requiereAdelanto && onAdelanto && abierta && (
          <button
            className={`btn btn--sm ${cita.adelantoPagado ? 'btn--outline' : 'btn--pago'}`}
            onClick={() => onAdelanto(cita)}
          >
            {cita.adelantoPagado ? 'Adelanto recibido' : 'Adelanto'}
          </button>
        )}
        {onTardanza && abierta && (
          <button
            className={`btn btn--sm ${cita.tardanzaAplicada ? 'btn--outline' : 'btn--danger'}`}
            onClick={() => onTardanza(cita)}
          >
            {cita.tardanzaAplicada ? 'Quitar tardanza' : 'Aplicar tardanza'}
          </button>
        )}
        {!cita.pagada &&
          saldo > 0 &&
          (estado === 'CONFIRMADA' || estado === 'COMPLETADA') &&
          onRegistrarPago && (
            <button className="btn btn--sm btn--pago" onClick={() => onRegistrarPago(cita)}>
              Cobrar saldo
            </button>
          )}
        {estado === 'CANCELADA' && cita.pagada && (
          <span className="badge badge--pago">Devolver {formatMoney(cita.montoPagado)}</span>
        )}
        {(estado === 'PENDIENTE' || estado === 'CONFIRMADA') && (
          <button
            className="btn btn--sm btn--danger"
            onClick={() => {
              if (window.confirm(`¿Cancelar la cita de ${cita.nombreCliente}?`)) onEstado(cita.id, 'CANCELADA')
            }}
          >
            Cancelar cita
          </button>
        )}
        {onReprogramar && abierta && (
          <button className="btn btn--sm btn--outline" onClick={() => onReprogramar(cita)}>
            Reprogramar
          </button>
        )}
        {onEliminar && !cita.pagada && !cita.adelantoPagado && (
          <button className="btn btn--sm btn--outline cita__eliminar" onClick={() => onEliminar(cita)}>
            Eliminar
          </button>
        )}
      </div>
    </article>
  )
}