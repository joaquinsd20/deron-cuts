const WORK = [
  { label: 'Low Fade', tag: 'Fade', cls: 'gallery__item--foto', img: '/cortes/IMG_3922.jpg' },
  { label: 'Drop Fade con diseño en la nuca', tag: 'Diseño', cls: 'gallery__item--foto', img: '/cortes/IMG_4208.jpg' },
  { label: 'Taper Fade', tag: 'Fade', cls: 'gallery__item--foto', img: '/cortes/IMG_5413.jpg' },
  { label: 'Mid Taper Fade', tag: 'Fade', cls: 'gallery__item--foto', img: '/cortes/corte-4.jpg' },
  { label: 'Barba perfilada', tag: 'Barba', cls: 'gallery__item--barba' },
  { label: 'Línea personalizada', tag: 'Diseño', cls: 'gallery__item--diseno' }
]

export default function Gallery() {
  return (
    <section className="section" id="trabajos">
      <div className="container">
        <span className="section-tag">El portafolio</span>

    

        <div className="gallery__grid">
          {WORK.map((w) => (
            <div
              className={`gallery__item ${w.cls}`}
              key={w.label}
              style={w.img ? { backgroundImage: `url(${w.img})` } : undefined}
            >
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