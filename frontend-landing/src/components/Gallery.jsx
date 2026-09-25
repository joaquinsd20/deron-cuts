const WORK = [
  { label: 'Fade a la piel', tag: 'Fade', cls: 'gallery__item--fade' },
  { label: 'Barba perfilada', tag: 'Barba', cls: 'gallery__item--barba' },
  { label: 'Línea personalizada', tag: 'Diseño', cls: 'gallery__item--diseno' },
  { label: 'Degradado alto', tag: 'Fade', cls: 'gallery__item--mix' },
  { label: 'Corte urbano', tag: 'Urbano', cls: 'gallery__item--diseno' },
  { label: 'Texturizado con navaja', tag: 'Barba', cls: 'gallery__item--mix' }
]

export default function Gallery() {
  return (
    <section className="section" id="trabajos">
      <div className="container">
        <span className="section-tag">El portafolio</span>
        <h2 className="section-title">
          Nuestros <span className="acc">trabajos</span>
        </h2>
    

        <div className="gallery__grid">
          {WORK.map((w) => (
            <div className={`gallery__item ${w.cls}`} key={w.label}>
              <span className="gallery__beam" aria-hidden="true" />
              <span className="gallery__label">{w.label}</span>
              <span className="gallery__tag">{w.tag}</span>
            </div>
          ))}
        </div>

    
      </div>
    </section>
  )
}