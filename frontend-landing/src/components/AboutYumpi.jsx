export default function AboutYumpi({ config }) {
  const nombreBarbero = config?.nombreBarbero || 'Yumpi'
  const descripcion = config?.descripcionBarbero

  return (
    <section className="section about" id="yumpi">
      <div className="container">
        <div className="about__grid">
          <div className="about__photo about__photo--img" role="img" aria-label={nombreBarbero}>
            <img
              className="about__img"
              src="/yumpi/yumpi.jpg"
              alt={nombreBarbero}
              width="1200"
              height="1500"
              loading="lazy"
            />
            <span className="about__scan" aria-hidden="true" />
          </div>

          <div>
            <span className="section-tag">Detrás de la marca</span>
            <h2 className="about__name">{nombreBarbero}</h2>
            <p className="about__desc">{descripcion}</p>

           
          </div>
        </div>
      </div>
    </section>
  )
}