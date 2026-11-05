import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { beginLoading, endLoading } from '../lib/loading.js'
import { getServicios } from '../services/api.js'

const SHOTS = [
  {
    img: '/cortes/IMG_3922.jpg',
    label: 'Low Fade',
    precio: 'S/ 35',
    desc: 'Degradado bajo, limpio y con transición suave. Un clásico que siempre queda bien.'
  },
  {
    img: '/cortes/IMG_4208.jpg',
    label: 'Drop Fade',
    precio: 'S/ 50',
    desc: 'El fade que baja por detrás para un acabado moderno, con más contraste y movimiento.'
  },
  {
    img: '/cortes/IMG_5413.jpg',
    label: 'Taper Fade',
    precio: 'S/ 25',
    desc: 'Laterales ajustados y nuca degradada. Práctico, limpio y fácil de mantener.'
  },
  {
    img: '/cortes/corte-4.jpg',
    label: 'Mid Taper Fade',
    precio: 'S/ 30',
    desc: 'Taper medio, equilibrado para cualquier rostro. Ni tan bajo, ni tan marcado.'
  },
  {
    img: '/cortes/burst%20fade.jpg',
    label: 'Burst Fade',
    precio: 'S/ 40',
    desc: 'Degradado en ráfaga alrededor de la oreja, con curvas marcadas y un look moderno.'
  },
  {
    img: '/cortes/modern%20mullet.jpg',
    label: 'Modern Mullet',
    precio: 'S/ 45',
    desc: 'Laterales cortos, movimiento atrás y actitud. Una versión actual del mullet clásico.'
  }
]

const PERSONALIZADO = {
  label: 'Personalizado',
  precio: 'S/ 30',
  desc: 'Líneas, diseños y detalles a tu medida. Cuéntanos tu idea y la trabajamos contigo.',
  custom: true
}

function formatPrecio(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return ''
  return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`
}

function normalizar(texto) {
  return String(texto || '').trim().toLowerCase()
}

// Convierte un servicio del backend (catálogo del admin) al formato de la tarjeta.
// Si el servicio no tiene imagen, reutiliza la foto local con el mismo nombre.
function aTarjeta(servicio) {
  const local = SHOTS.find((s) => normalizar(s.label) === normalizar(servicio.nombre))
  return {
    id: servicio.id,
    img: servicio.imagenUrl || local?.img || null,
    label: servicio.nombre,
    precio: formatPrecio(servicio.precio),
    desc: servicio.descripcion || local?.desc || '',
    custom: !(servicio.imagenUrl || local?.img)
  }
}

export default function Services() {
  const [shots, setShots] = useState(SHOTS)
  const trackRef = useRef(null)
  const drag = useRef({ activo: false, inicioX: 0, ultimoX: 0, scrollInicial: 0, movido: false })
  const [detalle, setDetalle] = useState(null)
  const [puedeAtras, setPuedeAtras] = useState(false)
  const [puedeAdelante, setPuedeAdelante] = useState(true)

  useEffect(() => {
    let activo = true
    getServicios()
      .then((lista) => {
        if (!activo || !Array.isArray(lista)) return
        const visibles = lista.filter((s) => s.activo !== false)
        if (visibles.length) setShots(visibles.map(aTarjeta))
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const actualizar = () => {
      setPuedeAtras(track.scrollLeft > 4)
      setPuedeAdelante(track.scrollLeft + track.clientWidth < track.scrollWidth - 4)
    }

    actualizar()
    track.addEventListener('scroll', actualizar, { passive: true })
    window.addEventListener('resize', actualizar)

    return () => {
      track.removeEventListener('scroll', actualizar)
      window.removeEventListener('resize', actualizar)
    }
  }, [])

  useEffect(() => {
    if (!detalle) return

    const cerrarConEscape = (e) => {
      if (e.key === 'Escape') setDetalle(null)
    }

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [detalle])

  const mover = (direccion) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector('.shot')
    const paso = card ? card.getBoundingClientRect().width + 16 : 300
    track.scrollBy({ left: direccion * paso, behavior: 'smooth' })
  }

  const iniciarArrastre = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = {
      activo: true,
      inicioX: e.clientX,
      ultimoX: e.clientX,
      scrollInicial: trackRef.current.scrollLeft,
      movido: false
    }
  }

  const moverArrastre = (e) => {
    const estado = drag.current
    if (!estado.activo) return

    estado.ultimoX = e.clientX
    const delta = e.clientX - estado.inicioX
    if (Math.abs(delta) > 8) estado.movido = true
    trackRef.current.scrollLeft = estado.scrollInicial - delta
  }

  const terminarArrastre = () => {
    const estado = drag.current
    if (!estado.activo) return
    estado.activo = false
    if (!estado.movido) return

    const delta = estado.ultimoX - estado.inicioX
    if (Math.abs(delta) < 40) return

    const track = trackRef.current
    const cards = track.querySelectorAll('.shot')
    const card = cards[0]
    if (!card) return

    const paso = card.getBoundingClientRect().width + 16
    const indiceActual = Math.round(estado.scrollInicial / paso)
    const siguiente = Math.min(cards.length - 1, Math.max(0, indiceActual + (delta < 0 ? 1 : -1)))
    track.scrollTo({ left: siguiente * paso, behavior: 'smooth' })
  }

  const abrirDetalle = (corte) => {
    if (drag.current.movido) {
      drag.current.movido = false
      return
    }
    beginLoading()
    if (corte.custom) {
      window.setTimeout(() => endLoading(), 400)
    }
    setDetalle(corte)
  }

  return (
    <section className="section services" id="servicios">
      <div className="container">
        <span className="section-tag">El menú</span>

        <div className="services__carousel">
          <div
            className="services__track"
            ref={trackRef}
            onPointerDown={iniciarArrastre}
            onPointerMove={moverArrastre}
            onPointerUp={terminarArrastre}
            onPointerLeave={terminarArrastre}
            onPointerCancel={terminarArrastre}
            onDragStart={(e) => e.preventDefault()}
          >
            {shots.map((s) => (
              <button
                type="button"
                className={s.img ? 'shot' : 'shot shot--custom'}
                key={s.id ?? s.label}
                onClick={() => abrirDetalle(s)}
                aria-label={`Ver detalle de ${s.label}`}
              >
                {s.img ? (
                  <img src={s.img} alt={s.label} loading="lazy" draggable={false} />
                ) : (
                  <span className="shot__custom-art" aria-hidden="true">
                    <span>✂</span>
                  </span>
                )}
                <span className="shot__meta">
                  <span className="shot__label">{s.label}</span>
                  <span className="shot__price">{s.precio}</span>
                </span>
              </button>
            ))}

            <button
              type="button"
              className="shot shot--custom"
              onClick={() => abrirDetalle(PERSONALIZADO)}
              aria-label="Ver detalle de corte personalizado"
            >
              <span className="shot__custom-art" aria-hidden="true">
                <span>+</span>
              </span>
              <span className="shot__meta">
                <span className="shot__label">{PERSONALIZADO.label}</span>
                <span className="shot__price">{PERSONALIZADO.precio}</span>
              </span>
            </button>
          </div>

          <div className="services__nav">
            <button
              type="button"
              className="services__arrow"
              onClick={() => mover(-1)}
              disabled={!puedeAtras}
              aria-label="Ver cortes anteriores"
            >
              ‹
            </button>
            <button
              type="button"
              className="services__arrow"
              onClick={() => mover(1)}
              disabled={!puedeAdelante}
              aria-label="Ver más cortes"
            >
              ›
            </button>
          </div>
        </div>

        <div className="services__no-grid">
          <p>
            ¿No encuentras el corte que buscas?{' '}
            <Link to="/reservar" className="services__link">
              Resérvalo y lo hacemos personalizado
            </Link>
          </p>
        </div>
      </div>

      {detalle && (
        <div
          className="shot-modal"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetalle(null)
          }}
        >
          <div className="shot-modal__panel" role="dialog" aria-modal="true" aria-labelledby="shot-modal-title">
            <button
              type="button"
              className="shot-modal__close"
              onClick={() => setDetalle(null)}
              aria-label="Cerrar detalle"
            >
              ×
            </button>

            {detalle.custom || !detalle.img ? (
              <div className="shot-modal__art" aria-hidden="true">
                <span>+</span>
              </div>
            ) : (
              <img src={detalle.img} alt={detalle.label} onLoad={() => endLoading()} onError={() => endLoading()} />
            )}

            <div className="shot-modal__body">
              <span className="shot-modal__price">{detalle.precio}</span>
              <h3 className="shot-modal__title" id="shot-modal-title">
                {detalle.label}
              </h3>
              <p className="shot-modal__desc">{detalle.desc}</p>
              <Link to="/reservar" className="btn btn--primary" onClick={() => setDetalle(null)}>
                Reservar este corte
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
