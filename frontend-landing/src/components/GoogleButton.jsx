import { useEffect, useRef } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function GoogleButton({ onCredential, disabled }) {
  const contenedor = useRef(null)
  const callback = useRef(onCredential)

  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!CLIENT_ID || disabled) return

    const inicializar = () => {
      if (!contenedor.current || !window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (respuesta) => callback.current?.(respuesta.credential)
      })
      window.google.accounts.id.renderButton(contenedor.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320
      })
    }

    if (window.google?.accounts?.id) {
      inicializar()
      return
    }

    const existente = document.getElementById('google-gsi')
    if (existente) {
      existente.addEventListener('load', inicializar)
      return () => existente.removeEventListener('load', inicializar)
    }

    const script = document.createElement('script')
    script.id = 'google-gsi'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.addEventListener('load', inicializar)
    document.head.appendChild(script)

    return () => script.removeEventListener('load', inicializar)
  }, [disabled])

  if (!CLIENT_ID) {
    return (
      <div className="auth__google auth__google--off">
        <button type="button" className="btn btn--outline auth__google-btn" disabled>
          Continuar con Google
        </button>
        <span className="hint">
          Falta configurar <b>VITE_GOOGLE_CLIENT_ID</b> para activar Google.
        </span>
      </div>
    )
  }

  return <div className="auth__google" ref={contenedor} />
}
