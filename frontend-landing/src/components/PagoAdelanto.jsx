import { useState } from 'react'
import { resolverImagen } from '../services/api.js'
import { comprimirImagen } from '../services/imagen.js'
import { formatCurrency } from '../config.js'

const LOGOS = { YAPE: '/pagos/yape.png', PLIN: '/pagos/plin.png' }

function formatearNumero(n) {
  const d = String(n || '').replace(/\D/g, '')
  return d.length === 9 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d
}

/**
 * Paso de pago al reservar: el cliente yapea el adelanto al QR/número del negocio y
 * reporta el número de operación y/o la captura. Sin esto la cita no se guarda.
 */
export default function PagoAdelanto({ monto, config, valor, onChange, error }) {
  const [copiado, setCopiado] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const metodos = (config?.metodosPago || ['YAPE', 'PLIN']).filter((m) => m !== 'EFECTIVO')
  const numero = config?.yapeNumero
  const qr = config?.qrPagoUrl ? resolverImagen(config.qrPagoUrl) : '/pagos/yape-qr.jpg'

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(String(numero))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* el número sigue visible para copiarlo a mano */
    }
  }

  const elegirCaptura = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setProcesando(true)
    try {
      const reducida = await comprimirImagen(archivo, 1200, 0.82)
      const dataUrl = await new Promise((resolve, reject) => {
        const lector = new FileReader()
        lector.onload = () => resolve(lector.result)
        lector.onerror = reject
        lector.readAsDataURL(reducida)
      })
      onChange({ ...valor, comprobante: dataUrl })
    } catch {
      onChange({ ...valor, comprobante: null })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <section className="pago" aria-labelledby="pago-titulo">
      <div className="pago__cabecera">
        <h3 id="pago-titulo">Paga tu adelanto para guardar tu cita</h3>
        <span className="pago__monto">{formatCurrency(monto)}</span>
      </div>

      <div className="pago__cuerpo">
        <div className="pago__qr">
          <img src={qr} alt="Código QR para pagar con Yape" />
          <span>Escanéalo desde Yape o Plin</span>
        </div>

        <div className="pago__datos">
          {numero && (
            <div className="pago__numero">
              <span className="pago__etiqueta">O yapea al número</span>
              <div>
                <strong>{formatearNumero(numero)}</strong>
                <button type="button" className="pago__copiar" onClick={copiar}>
                  {copiado ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              {config?.yapeTitular && <span className="pago__titular">A nombre de {config.yapeTitular}</span>}
            </div>
          )}

          <ol className="pago__pasos">
            <li>
              Paga exactamente <b>{formatCurrency(monto)}</b> (50% del corte).
            </li>
            <li>Escribe el número de operación o sube la captura.</li>
            <li>{config?.nombreBarbero || 'El barbero'} verifica el pago y te confirmamos la cita.</li>
          </ol>
        </div>
      </div>

      <div className="pago__form">
        <span className="pago__etiqueta">¿Con qué pagaste?</span>
        <div className="pago__metodos">
          {metodos.map((m) => (
            <button
              key={m}
              type="button"
              className={`pago__metodo${valor.metodo === m ? ' pago__metodo--activo' : ''}`}
              onClick={() => onChange({ ...valor, metodo: m })}
            >
              {LOGOS[m] ? <img src={LOGOS[m]} alt="" /> : <span className="pago__metodo-ini">{m.slice(0, 2)}</span>}
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="pago-op">Número de operación</label>
          <input
            id="pago-op"
            inputMode="numeric"
            maxLength={40}
            placeholder="Aparece en tu Yape después de pagar"
            value={valor.operacion}
            onChange={(e) => onChange({ ...valor, operacion: e.target.value })}
          />
        </div>

        <div className="pago__captura">
          {valor.comprobante ? (
            <div className="pago__preview">
              <img src={valor.comprobante} alt="Tu captura del pago" />
              <button type="button" className="btn btn--outline" onClick={() => onChange({ ...valor, comprobante: null })}>
                Quitar captura
              </button>
            </div>
          ) : (
            <label className="btn btn--outline pago__subir">
              {procesando ? 'Procesando…' : '📷 Subir captura del pago'}
              <input type="file" accept="image/*" hidden onChange={elegirCaptura} disabled={procesando} />
            </label>
          )}
          <span className="pago__ayuda">Con el número de operación o la captura basta; mejor si mandas ambos.</span>
        </div>

        {error && <div className="alert">{error}</div>}
      </div>
    </section>
  )
}
