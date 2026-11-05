import { Link } from 'react-router-dom'

const PASOS = [
  {
    n: '01',
    titulo: 'Elige tu corte',
    texto: 'Mira el menú y toca el estilo que quieres. Si no lo ves, pide uno personalizado.'
  },
  {
    n: '02',
    titulo: 'Escoge día y hora',
    texto: 'Solo verás horarios libres de verdad. Nadie más puede tomar el tuyo.'
  },
  {
    n: '03',
    titulo: 'Confirma y listo',
    texto: 'Envía el 50% por Yape o Plin al WhatsApp y tu cita queda asegurada.'
  }
]

export default function Pasos() {
  return (
    <section className="section pasos" id="como-reservar">
      <div className="container">
        <span className="section-tag">Cómo reservar</span>
        <h2 className="section-title">
          Tu cita en <span className="acc">3 pasos</span>
        </h2>
        <ol className="pasos__grid">
          {PASOS.map((p) => (
            <li className="paso" key={p.n}>
              <span className="paso__n" aria-hidden="true">
                {p.n}
              </span>
              <h3 className="paso__titulo">{p.titulo}</h3>
              <p className="paso__texto">{p.texto}</p>
            </li>
          ))}
        </ol>
        <div className="pasos__cta">
          <Link to="/reservar" className="btn btn--primary">
            Empezar mi reserva
          </Link>
          <span className="pasos__nota">Toma menos de un minuto</span>
        </div>
      </div>
    </section>
  )
}
