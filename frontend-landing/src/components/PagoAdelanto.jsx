import { useEffect, useState } from 'react'
import { resolverImagen } from '../services/api.js'
import { comprimirImagen } from '../services/imagen.js'
import { leerMontoDeCaptura, precargarLector } from '../services/leerMonto.js'
import { formatCurrency } from '../config.js'

/** ¿La captura ya permite enviar el pago? (monto correcto, o el lector no pudo cargar). */
export function pagoListo(valor) {
  const estado = valor?.verificacion?.estado
  return Boolean(valor?.comprobante) && (estado === 'ok' || estado === 'error')
}

/** Mensaje para el cliente cuando aún no puede enviar el pago. */
export function motivoPagoPendiente(valor, monto) {
  if (!valor?.comprobante) return 'Sube la captura de tu pago para reservar.'
  const v = valor.verificacion
  if (!v || v.estado === 'leyendo') return 'Espera un momento: estamos revisando el monto de tu captura.'
  if (v.estado === 'distinto') {
    return `Tu captura muestra ${formatCurrency(v.monto)}, pero el adelanto es ${formatCurrency(monto)}. Paga el monto exacto y sube esa captura.`
  }
  if (v.estado === 'ilegible') {
    return 'No pudimos leer el monto en la captura. Sube una captura completa y nítida donde se vea el monto pagado.'
  }
  return null
}

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
    let dataUrl = null
    try {
      const reducida = await comprimirImagen(archivo, 1200, 0.82)
      dataUrl = await new Promise((resolve, reject) => {
        const lector = new FileReader()
        lector.onload = () => resolve(lector.result)
        lector.onerror = reject
        lector.readAsDataURL(reducida)
      })
    } catch {
      onChange({ ...valor, comprobante: null, verificacion: null })
      setProcesando(false)
      return
    }
    setProcesando(false)
    onChange({ ...valor, comprobante: dataUrl, verificacion: { estado: 'leyendo' } })
    // Se lee la imagen original (más nítida que la comprimida) para no fallar con los céntimos.
    const resultado = await leerMontoDeCaptura(archivo, monto)
    // Forma funcional: conserva lo que el cliente escribió mientras se leía la foto.
    onChange((actual) =>
      actual.comprobante === dataUrl
        ? { ...actual, verificacion: { estado: resultado.estado, monto: resultado.monto } }
        : actual
    )
  }

  useEffect(() => {
    precargarLector()
  }, [])

  const verif = valor.verificacion

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
            <li>Sube la captura: revisamos que el monto sea el correcto.</li>
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

        <div className="pago__captura">
          <span className="pago__etiqueta">Foto de tu pago</span>
          {valor.comprobante ? (
            <div className="pago__preview">
              <img src={valor.comprobante} alt="Tu captura del pago" />
              <div>
                {(!verif || verif.estado === 'leyendo') && <strong>Revisando el monto…</strong>}
                {verif?.estado === 'ok' && (
                  <strong className="pago__verif pago__verif--ok">✓ Monto correcto: {formatCurrency(monto)}</strong>
                )}
                {verif?.estado === 'distinto' && (
                  <strong className="pago__verif pago__verif--mal">
                    ✗ La captura dice {formatCurrency(verif.monto)}; debes pagar {formatCurrency(monto)}
                  </strong>
                )}
                {verif?.estado === 'ilegible' && (
                  <strong className="pago__verif pago__verif--mal">✗ No se ve el monto en la captura</strong>
                )}
                {verif?.estado === 'error' && <strong>✓ Captura lista (el barbero revisará el monto)</strong>}
                <button
                  type="button"
                  className="pago__quitar"
                  onClick={() => onChange({ ...valor, comprobante: null, verificacion: null })}
                >
                  Cambiar foto
                </button>
              </div>
            </div>
          ) : (
            <label className="pago__zona">
              <input
                type="file"
                accept="image/*"
                className="pago__archivo"
                onChange={elegirCaptura}
                disabled={procesando}
              />
              <span className="pago__zona-icono" aria-hidden="true">
                📷
              </span>
              <strong>{procesando ? 'Procesando foto…' : 'Sube la captura de tu Yape o Plin'}</strong>
              <span>Toca aquí y elige la foto del pago desde tu galería</span>
            </label>
          )}
        </div>

        <div className="field">
          <label htmlFor="pago-op">Número de operación (opcional)</label>
          <input
            id="pago-op"
            inputMode="numeric"
            maxLength={40}
            placeholder="Aparece en tu Yape después de pagar"
            value={valor.operacion}
            onChange={(e) => onChange({ ...valor, operacion: e.target.value })}
          />
          <span className="pago__ayuda">La captura es obligatoria; el número ayuda al barbero a encontrar tu pago.</span>
        </div>

        {error && <div className="alert">{error}</div>}
      </div>
    </section>
  )
}
