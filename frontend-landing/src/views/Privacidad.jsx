import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Privacidad() {
  return (
    <>
      <Navbar />
      <main className="legal container">
        <span className="section-tag">Legal</span>
        <h1 className="legal__title">Política de privacidad</h1>
        <p className="legal__updated">Última actualización: 4 de noviembre de 2026</p>

        <section className="legal__block">
          <h2>1. Quiénes somos</h2>
          <p>
            DERON CUTS (“nosotros”) es una barbería ubicada en Valeriano 362 - Huaman.
            Esta política explica cómo recopilamos, usamos y protegemos tus datos personales
            cuando usas nuestro sitio web y nuestro sistema de reservas.
          </p>
        </section>

        <section className="legal__block">
          <h2>2. Datos que recopilamos</h2>
          <ul>
            <li>Nombre completo, correo electrónico y número de WhatsApp / teléfono.</li>
            <li>Fecha de nacimiento (para el beneficio de corte gratis en tu semana de cumpleaños).</li>
            <li>Historial de citas, servicios reservados y preferencias.</li>
            <li>Si inicias sesión con Google, recibimos tu nombre, correo y foto de perfil.</li>
            <li>Datos técnicos: dirección IP, tipo de navegador y páginas visitadas.</li>
          </ul>
        </section>

        <section className="legal__block">
          <h2>3. Para qué usamos tus datos</h2>
          <ul>
            <li>Gestionar tus reservas y enviarte recordatorios por WhatsApp.</li>
            <li>Verificar tu identidad y proteger tu cuenta.</li>
            <li>Mejorar nuestros servicios y la experiencia del sitio.</li>
            <li>Cumplir con obligaciones legales.</li>
          </ul>
        </section>

        <section className="legal__block">
          <h2>4. Con quién compartimos tus datos</h2>
          <p>
            No vendemos tus datos. Solo los compartimos con proveedores necesarios para
            operar el servicio (alojamiento, base de datos, envío de mensajes) y cuando la ley
            lo exija.
          </p>
        </section>

        <section className="legal__block">
          <h2>5. Conservación y seguridad</h2>
          <p>
            Guardamos tus datos solo el tiempo necesario para prestar el servicio. Usamos
            cifrado, contraseñas hasheadas y conexiones seguras (HTTPS) para protegerlos.
          </p>
        </section>

        <section className="legal__block">
          <h2>6. Tus derechos</h2>
          <p>
            Puedes solicitar acceso, corrección o eliminación de tus datos escribiéndonos a
            hola@deroncuts.com o por WhatsApp al +51 990 750 147.
          </p>
        </section>

        <section className="legal__block">
          <h2>7. Cookies</h2>
          <p>
            Usamos cookies y almacenamiento local para mantener tu sesión iniciada y recordar
            preferencias. Puedes desactivarlas en tu navegador, aunque algunas funciones
            dejarán de funcionar.
          </p>
        </section>

        <section className="legal__block">
          <h2>8. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política. Los cambios se publicarán en esta página con la
            nueva fecha de actualización.
          </p>
        </section>

        <div className="legal__back">
          <Link to="/" className="btn btn--outline">
            Volver al inicio
          </Link>
        </div>
      </main>
      <Footer config={null} />
    </>
  )
}
