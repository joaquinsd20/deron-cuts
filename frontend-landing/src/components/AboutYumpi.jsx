export default function AboutYumpi({ config }) {
  const nombreBarbero = config?.nombreBarbero || 'Yumpi'
  const descripcion = config?.descripcionBarbero

  return (
    <section className="section about" id="yumpi">
      <div className="container">
        <div className="about__grid">
          <div className="about__photo" role="img" aria-label={nombreBarbero}>
            <span className="about__scan" aria-hidden="true" />
          </div>

          <div>
            <span className="section-tag">Detrás de la marca</span>
            <h2 className="about__name">{nombreBarbero}</h2>
            <p className="about__role"> Detrás de DERON CUTS</p>
            <p className="about__desc">{descripcion}</p>

            <div className="about__chips">
              <span className="chip chip--ok">Fades y degradados</span>
              <span className="chip">Barba y perfilado</span>
              <span className="chip chip--accent">Cortes urbanos</span>
              <span className="chip">Detalles personalizados</span>
              <span className="chip chip--ok">Buen ambiente</span>
              <span className="chip">Música en el local</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}