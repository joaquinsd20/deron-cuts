import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getMisCitas } from '../services/api.js'
import { formatCurrency, formatFechaLarga } from '../config.js'

export default function Cuenta() {
  const navigate = useNavigate()
  const { cliente, cerrarSesion } = useAuth()
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getMisCitas()
      .then(setCitas)
      .catch(() => setCitas([]))
      .finally(() => setCargando(false))
  }, [])

  const salir = () => {
    cerrarSesion()
    navigate('/')
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="account container">
          <header className="booking__head">
            <span className="wizard__label">Mi cuenta</span>
            <h1 className="booking__title">{cliente?.nombre}</h1>
            <p className="booking__sub">
              {cliente?.email} · {cliente?.telefono}
            </p>
          </header>

          <div className="account__grid">
            <div className="account__card">
              <div className="aside__title">Tus datos</div>
              <div className="aside__row">
                <span>Nombre</span>
                <b>{cliente?.nombre}</b>
              </div>
              <div className="aside__row">
                <span>Correo</span>
                <span className="val">{cliente?.email}</span>
              </div>
              <div className="aside__row">
                <span>Teléfono</span>
                <span className="val">{cliente?.telefono}</span>
              </div>
              <div className="aside__row">
                <span>Cumpleaños</span>
                <span className="val">
                  {cliente?.fechaNacimiento ? formatFechaLarga(cliente.fechaNacimiento) : '—'}
                </span>
              </div>
              <div className="aside__row">
                <span>Google</span>
                <span className="val">{cliente?.googleVinculado ? 'Vinculado' : 'No vinculado'}</span>
              </div>
              <div className="account__actions">
                <Link to="/reservar" className="btn btn--primary">
                  Reservar un corte
                </Link>
                <button type="button" className="btn btn--outline" onClick={salir}>
                  Cerrar sesión
                </button>
              </div>
              <div className="policy">
                <b>Cumpleaños:</b> corte gratis durante la semana de tu cumpleaños.
                <br />
                <b>Reservas:</b> 50% de adelanto. Tolerancia de 15 minutos; después se pierde
                el adelanto y se suman S/ 10.
              </div>
            </div>

            <div className="account__card">
              <div className="aside__title">Mis citas</div>
              {cargando ? (
                <div className="spinner" />
              ) : citas.length === 0 ? (
                <div className="empty">Todavía no tienes citas reservadas.</div>
              ) : (
                <div className="account__citas">
                  {citas.map((cita) => (
                    <article className="account__cita" key={cita.id}>
                      <div className="account__cita-head">
                        <b>{cita.nombreServicio}</b>
                        <span className={`account__badge account__badge--${(cita.estado || '').toLowerCase()}`}>
                          {cita.estado}
                        </span>
                      </div>
                      <div className="account__cita-meta">
                        {formatFechaLarga(cita.fechaHoraInicio)} · {cita.fechaHoraInicio?.slice(11, 16)}
                      </div>
                      <div className="account__cita-meta">
                        {cita.descuentoCumpleanos ? 'Cumpleaños: gratis' : `Precio: ${formatCurrency(cita.precioFinal)}`}
                        {cita.adelantoMonto > 0 && (
                          <>
                            {' · '}Adelanto {formatCurrency(cita.adelantoMonto)}:{' '}
                            {cita.adelantoPagado ? 'recibido' : 'pendiente'}
                          </>
                        )}
                        {cita.saldoPendiente > 0 && (
                          <>
                            {' · '}Pendiente {formatCurrency(cita.saldoPendiente)}
                          </>
                        )}
                        {cita.tardanzaAplicada && (
                          <>
                            {' · '}Tardanza +{formatCurrency(cita.penalidadTardanza)}
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer config={null} />
    </>
  )
}
