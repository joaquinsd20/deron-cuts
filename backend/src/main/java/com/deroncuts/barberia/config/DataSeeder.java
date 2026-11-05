package com.deroncuts.barberia.config;

import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.EstadoCita;
import com.deroncuts.barberia.model.MetodoPago;
import com.deroncuts.barberia.model.Servicio;
import com.deroncuts.barberia.model.UsuarioAdmin;
import com.deroncuts.barberia.repository.CitaRepository;
import com.deroncuts.barberia.repository.ServicioRepository;
import com.deroncuts.barberia.repository.UsuarioAdminRepository;
import com.deroncuts.barberia.service.ConfiguracionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UsuarioAdminRepository usuarioAdminRepository;
    private final ServicioRepository servicioRepository;
    private final CitaRepository citaRepository;
    private final ConfiguracionService configuracionService;
    private final PasswordEncoder passwordEncoder;
    private final String adminDefaultPassword;
    private final com.deroncuts.barberia.service.ServicioService servicioService;

    public DataSeeder(UsuarioAdminRepository usuarioAdminRepository,
                      ServicioRepository servicioRepository,
                      CitaRepository citaRepository,
                      ConfiguracionService configuracionService,
                      PasswordEncoder passwordEncoder,
                      @Value("${app.admin.default-password}") String adminDefaultPassword,
                      com.deroncuts.barberia.service.ServicioService servicioService) {
        this.servicioService = servicioService;
        this.usuarioAdminRepository = usuarioAdminRepository;
        this.servicioRepository = servicioRepository;
        this.citaRepository = citaRepository;
        this.configuracionService = configuracionService;
        this.passwordEncoder = passwordEncoder;
        this.adminDefaultPassword = adminDefaultPassword;
    }

    @Override
    public void run(String... args) {
        configuracionService.obtenerOMeterDefault();
        sembrarAdmin();
        sembrarServicios();
        limpiarServiciosDemoAntiguos();
        // Citas ficticias ("Luis Torres", etc.) solo para desarrollo, nunca en producción.
        if (Boolean.parseBoolean(System.getenv().getOrDefault("APP_DEMO_DATA", "false"))) {
            sembrarCitasDemo();
        }
    }

    private void sembrarAdmin() {
        java.util.Optional<UsuarioAdmin> existente = usuarioAdminRepository.findByUsername("yumpi");
        if (existente.isPresent()) {
            // APP_ADMIN_PASSWORD (Render) manda mientras el barbero no cambie su clave en el panel.
            // Si la olvida: APP_ADMIN_FORCE_RESET=true en Render, redeploy, entrar y quitar la variable.
            UsuarioAdmin admin = existente.get();
            boolean forzar = Boolean.parseBoolean(System.getenv().getOrDefault("APP_ADMIN_FORCE_RESET", "false"));
            if (admin.isPasswordDesdePanel() && !forzar) {
                return;
            }
            if (forzar || !passwordEncoder.matches(adminDefaultPassword, admin.getPasswordHash())) {
                admin.setPasswordHash(passwordEncoder.encode(adminDefaultPassword));
                admin.setPasswordDesdePanel(false);
                usuarioAdminRepository.save(admin);
                log.info("Contraseña del admin 'yumpi' sincronizada con APP_ADMIN_PASSWORD.");
            }
            return;
        }
        UsuarioAdmin admin = new UsuarioAdmin();
        admin.setUsername("yumpi");
        admin.setPasswordHash(passwordEncoder.encode(adminDefaultPassword));
        admin.setRol("ADMIN");
        admin.setActivo(true);
        usuarioAdminRepository.save(admin);
        log.info("Usuario admin 'yumpi' creado. Cambia la contraseña por defecto en producción.");
    }

    private static final List<String> CORTES_LANDING = List.of(
            "Low Fade", "Drop Fade", "Taper Fade", "Mid Taper Fade", "Burst Fade", "Modern Mullet");
    private static final List<String> SERVICIOS_DEMO_ANTIGUOS = List.of(
            "Fade clásico", "Corte + Barba", "Buzz cut", "Diseño personalizado");

    private void sembrarServicios() {
        if (servicioRepository.count() > 0) {
            // Migración única: bases creadas con el catálogo demo antiguo (sin fotos).
            // Si no existe ninguno de los cortes de la landing, se crean y se desactivan
            // los demo antiguos. Una vez creados, esto no vuelve a ejecutarse, así que lo
            // que el barbero cambie desde el admin se respeta.
            List<Servicio> actuales = servicioRepository.findAll();
            boolean tieneCortesLanding = actuales.stream()
                    .anyMatch(s -> CORTES_LANDING.stream().anyMatch(n -> n.equalsIgnoreCase(s.getNombre())));
            // Solo aplica a bases que aún muestran el catálogo demo antiguo. Si el barbero
            // borra los cortes desde el admin, no se vuelven a crear.
            boolean demoAntiguoVisible = actuales.stream()
                    .anyMatch(s -> s.isActivo() && SERVICIOS_DEMO_ANTIGUOS.contains(s.getNombre()));
            if (tieneCortesLanding || !demoAntiguoVisible) {
                return;
            }
            for (Servicio s : actuales) {
                if (SERVICIOS_DEMO_ANTIGUOS.contains(s.getNombre()) && s.getImagenUrl() == null) {
                    s.setActivo(false);
                    servicioRepository.save(s);
                }
            }
            crearCortesLanding();
            log.info("Catálogo migrado a los cortes de la landing; los servicios demo antiguos quedaron inactivos.");
            return;
        }
        crearCortesLanding();
        log.info("Servicios sembrados desde la landing. Administra desde el panel.");
    }

    /**
     * Quita del panel los servicios demo antiguos que quedaron desactivados tras la migración
     * (sin foto). Si alguno tiene citas en el historial se oculta en lugar de borrarse.
     */
    private void limpiarServiciosDemoAntiguos() {
        List<Servicio> actuales = servicioRepository.findAll();
        boolean hayCortesLanding = actuales.stream()
                .anyMatch(s -> !s.isEliminado() && CORTES_LANDING.contains(s.getNombre()));
        if (!hayCortesLanding) {
            return;
        }
        for (Servicio s : actuales) {
            if (SERVICIOS_DEMO_ANTIGUOS.contains(s.getNombre()) && !s.isActivo()
                    && !s.isEliminado() && s.getImagenUrl() == null) {
                servicioService.eliminar(s.getId());
                log.info("Servicio demo antiguo eliminado: {}", s.getNombre());
            }
        }
    }

    private void crearCortesLanding() {
        crear("Low Fade",
                "Degradado bajo, limpio y con transición suave. Un clásico que siempre queda bien.",
                "35.00", 45, "/cortes/IMG_3922.jpg");
        crear("Drop Fade",
                "El fade que baja por detrás para un acabado moderno, con más contraste y movimiento.",
                "50.00", 60, "/cortes/IMG_4208.jpg");
        crear("Taper Fade",
                "Laterales ajustados y nuca degradada. Práctico, limpio y fácil de mantener.",
                "25.00", 30, "/cortes/IMG_5413.jpg");
        crear("Mid Taper Fade",
                "Taper medio, equilibrado para cualquier rostro. Ni tan bajo, ni tan marcado.",
                "30.00", 45, "/cortes/corte-4.jpg");
        crear("Burst Fade",
                "Degradado en ráfaga alrededor de la oreja, con curvas marcadas y un look moderno.",
                "40.00", 45, "/cortes/burst%20fade.jpg");
        crear("Modern Mullet",
                "Laterales cortos, movimiento atrás y actitud. Una versión actual del mullet clásico.",
                "45.00", 50, "/cortes/modern%20mullet.jpg");
    }

    private void crear(String nombre, String descripcion, String precio, int duracion) {
        crear(nombre, descripcion, precio, duracion, null);
    }

    private void crear(String nombre, String descripcion, String precio, int duracion, String imagenUrl) {
        Servicio servicio = new Servicio();
        servicio.setNombre(nombre);
        servicio.setDescripcion(descripcion);
        servicio.setPrecio(new BigDecimal(precio));
        servicio.setDuracionMinutos(duracion);
        servicio.setImagenUrl(imagenUrl);
        servicio.setActivo(true);
        servicioRepository.save(servicio);
    }

    private void sembrarCitasDemo() {
        if (citaRepository.countByPagadaTrue() > 0 || citaRepository.existsByNombreCliente("Luis Torres")) {
            return;
        }
        List<Servicio> servicios = servicioRepository.findAll();
        if (servicios.isEmpty()) {
            return;
        }
        LocalDateTime ahora = LocalDateTime.now();

        crearCita(servicios.get(0), "Luis Torres", "+51 999 111 222", "luis@mail.com",
                ahora.minusHours(3), EstadoCita.COMPLETADA, MetodoPago.EFECTIVO);
        crearCita(servicios.get(2), "María Salas", "+51 988 222 333", null,
                ahora.minusDays(1).withHour(18), EstadoCita.COMPLETADA, MetodoPago.YAPE);
        crearCita(servicios.get(1), "Jorge Lima", "+51 977 333 444", "jorge@mail.com",
                ahora.minusDays(2).withHour(17), EstadoCita.COMPLETADA, MetodoPago.TARJETA);
        crearCita(servicios.get(3), "Ana Ríos", "+51 966 444 555", null,
                ahora.minusDays(4).withHour(16), EstadoCita.COMPLETADA, MetodoPago.PLIN);
        crearCita(servicios.get(1), "Pedro Núñez", "+51 955 555 666", "pedro@mail.com",
                ahora.minusDays(6).withHour(19), EstadoCita.COMPLETADA, MetodoPago.TRANSFERENCIA);
        crearCita(servicios.get(0), "Carlos Vera", "+51 944 666 777", null,
                ahora.plusDays(1).withHour(12), EstadoCita.CONFIRMADA, null);
        log.info("Citas demo sembradas con pagos para probar el módulo de pagos.");
    }

    private void crearCita(Servicio servicio, String nombre, String telefono, String email,
                           LocalDateTime inicio, EstadoCita estado, MetodoPago metodo) {
        Cita cita = new Cita();
        cita.setServicio(servicio);
        cita.setNombreCliente(nombre);
        cita.setTelefonoWhatsapp(telefono);
        cita.setEmail(email);
        cita.setNotas(null);
        cita.setFechaHoraInicio(inicio);
        cita.setFechaHoraFin(inicio.plusMinutes(servicio.getDuracionMinutos()));
        cita.setEstado(estado);
        if (metodo != null) {
            cita.setPagada(true);
            cita.setMetodoPago(metodo);
            cita.setMontoPagado(servicio.getPrecio());
            cita.setFechaPago(inicio);
        }
        citaRepository.save(cita);
    }
}