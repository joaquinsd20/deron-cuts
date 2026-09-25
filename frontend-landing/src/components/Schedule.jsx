import { DAY_LABELS_ES, WEEK_ORDER } from '../config.js'

export default function Schedule({ config }) {
  const horario = config?.horario || {}

  return (
    <section className="section schedule" id="horarios">
      <div className="container">
        <span className="section-tag">Horarios</span>
        <h2 className="section-title">
          Cuándo está <span className="acc">Yumpi</span>
        </h2>
  

        <div className="schedule__grid">
          {WEEK_ORDER.map((dia) => {
            const data = horario[dia]
            const abierto = data && data.activo && data.abre
            return (
              <div
                key={dia}
                className={`sched-cell${!abierto ? ' sched-cell--off' : ''}`}
              >
                <div className="sched-cell__day">{DAY_LABELS_ES[dia]}</div>
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