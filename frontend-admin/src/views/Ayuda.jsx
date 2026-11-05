import { useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import { cambiarMiPassword } from '../services/api.js'

const GUIA = [
  {
    titulo: '1. Llega una reserva',
    texto:
      'La cita aparece en Citas como PENDIENTE. El cliente ve que debe enviarte el 50% de adelanto por Yape o Plin a tu WhatsApp.'
  },
  {
    titulo: '2. Recibes el adelanto',
    texto:
      'Revisa tu Yape/Plin. Cuando llegue, en la cita toca "Adelanto" y elige el método. La cita pasa a CONFIRMADA y el horario queda asegurado.'
  },
  {
    titulo: '3. No llega el adelanto',
    texto:
      'Escríbele al cliente. Si no responde, toca "Cancelar cita" para liberar el horario y que otro lo pueda reservar.'
  },
  {
    titulo: '4. El día de la cita',
    texto:
      'Tolerancia de 15 minutos. Si llega más tarde, toca "Aplicar tardanza": pierde el adelanto y se suman S/ 10 al saldo.'
  },
  {
    titulo: '5. Al terminar',
    texto:
      'Toca "Completar" y luego "Cobrar saldo", eligiendo cómo te pagó (efectivo, Yape, Plin…). Todo queda sumado en Pagos.'
  },
  {
    titulo: 'Cumpleaños',
    texto:
      'Si la cita cae en la semana del cumpleaños del cliente, el corte es gratis y no pide adelanto. El sistema lo calcula solo.'
  },
  {
    titulo: 'Recordatorios',
    texto:
      'En Recordatorios toca "Enviar por WhatsApp": se abre el chat del cliente con el mensaje listo, solo presiona enviar.'
  },
  {
    titulo: 'Cliente olvidó su contraseña',
    texto: 'En Clientes búscalo, toca "Clave temporal" y envíasela por WhatsApp. Él la cambia en "Mi cuenta".'
  }
]

export default function Ayuda() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  const guardar = async (e) => {
    e.preventDefault()
    if (nueva.length < 8) {
      setToast({ message: 'La nueva contraseña debe tener al menos 8 caracteres', tipo: 'error' })
      return
    }
    if (nueva !== repetir) {
      setToast({ message: 'Las contraseñas nuevas no coinciden', tipo: 'error' })
      return
    }
    setGuardando(true)
    try {
      await cambiarMiPassword(actual, nueva)
      setActual('')
      setNueva('')
      setRepetir('')
      setToast({ message: 'Contraseña actualizada' })
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'No se pudo cambiar la contraseña', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Cuenta y <span>ayuda</span>
              </h1>
              <p className="page-head__sub">Cómo funcionan las reservas y tu contraseña del panel.</p>
            </div>
          </header>

          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card__title">Guía rápida: reservas y adelanto</div>
            <div className="guia">
              {GUIA.map((g) => (
                <div className="guia__item" key={g.titulo}>
                  <strong>{g.titulo}</strong>
                  <p>{g.texto}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__title">Cambiar mi contraseña</div>
            <form className="form-grid" onSubmit={guardar}>
              <div className="field">
                <label htmlFor="pwd-actual">Contraseña actual</label>
                <input
                  id="pwd-actual"
                  type="password"
                  autoComplete="current-password"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="pwd-nueva">Nueva contraseña (mínimo 8)</label>
                <input
                  id="pwd-nueva"
                  type="password"
                  autoComplete="new-password"
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="pwd-repetir">Repite la nueva contraseña</label>
                <input
                  id="pwd-repetir"
                  type="password"
                  autoComplete="new-password"
                  value={repetir}
                  onChange={(e) => setRepetir(e.target.value)}
                />
              </div>
              <div className="cita__actions">
                <button type="submit" className="btn btn--primary" disabled={guardando || !actual || !nueva}>
                  {guardando ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}
