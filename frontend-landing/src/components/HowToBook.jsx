const STEPS = [
  {
    title: 'Elige tu servicio',
    desc: 'Fade, corte + barba, buzz cut o diseño personalizado. Tú decides de qué vas a salir.'
  },
  {
    title: 'Elige fecha y hora',
    desc: 'Solo se muestran horarios realmente libres dentro del horario de atención de Yumpi.'
  },
  {
    title: 'Tus datos',
    desc: 'Nombre y WhatsApp para confirmar. El correo y las notas son opcionales.'
  },
  {
    title: 'Confirmación',
    desc: 'Revisa el resumen, confirma tu cita y quedas agendado con Yumpi.'
  }
]

export default function HowToBook() {
  return (
    <section className="section" id="reservar">
      <div className="container">
        <span className="section-tag">Así se reserva</span>
        <h2 className="section-title">
          Cuatro pasos y <span className="acc">listo</span>
        </h2>
        <p className="section-sub">
          Sin registros ni rollos: eliges, confirmas y llegas a la hora. Todo en menos de un minuto.
        </p>

        <div className="steps">
          {STEPS.map((s) => (
            <div className="step" key={s.title}>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}