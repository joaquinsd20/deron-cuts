import { DAY_LABELS_ES, WEEK_ORDER } from '../config.js'
import { diaDeHoyKey, estadoNegocio } from '../lib/horario.js'

export default function Schedule({ config }) {
  const horario = config?.horario || {}
  const hoy = diaDeHoyKey()
  const estado = config ? estadoNegocio(horario) : null

  return (
    <section className="section schedule" id="horarios">
      <div className="container">
        <span className="section-tag">Horarios</span>
        <h2 className="section-title">
          Cuándo está <span className="acc">Yumpi</span>
        </h2>
        {estado && (
          <div className={`live-status${estado.abierto ? ' live-status--open' : ''}`}>
            <span className="live-status__dot" aria-hidden="true" />
            {estado.texto}
          </div>
        )}

        <div className="schedule__grid">
          {WEEK_ORDER.map((dia) => {
            const data = horario[dia]
            const abierto = data && data.activo && data.abre
            const esHoy = dia === hoy
            return (
              <div
                key={dia}
                className={`sched-cell${!abierto ? ' sched-cell--off' : ''}${esHoy ? ' sched-cell--hoy' : ''}`}
              >
                <div className="sched-cell__day">
                  {DAY_LABELS_ES[dia]}
                  {esHoy && <span className="sched-cell__hoy">Hoy</span>}
                </div>
                <div className="sched-cell__hours">
                  {abierto ? `${data.abre} – ${data.cierra}` : 'Cerrado'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
