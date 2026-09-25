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

    public DataSeeder(UsuarioAdminRepository usuarioAdminRepository,
                      ServicioRepository servicioRepository,
                      CitaRepository citaRepository,
                      ConfiguracionService configuracionService,
                      PasswordEncoder passwordEncoder,
                      @Value("${app.admin.default-password}") String adminDefaultPassword) {
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
        sembrarCitasDemo();
    }

    private void sembrarAdmin() {
        if (usuarioAdminRepository.existsByUsername("yumpi")) {
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

    private void sembrarServicios() {
        if (servicioRepository.count() > 0) {
            return;
        }
        crear("Fade clásico",
                "Degradado limpio con máquina, acabado a tijera y detalle final. El clásico de DERON CUTS.",
                "35.00", 45);
        crear("Corte + Barba",
                "Corte con fades a tu estilo más perfilado y barba definida con toalla caliente.",
                "50.00", 60);
        crear("Buzz cut",
                "Corte ultra corto, rápido y preciso. Para quienes van al grano.",
                "25.00", 30);
        crear("Diseño personalizado",
                "Líneas y detalles a tu firma para ponerle personalidad al corte.",
                "30.00", 30);
        log.info("Servicios demo sembrados (precios placeholders). Administra desde el panel.");
    }

    private void crear(String nombre, String descripcion, String precio, int duracion) {
        Servicio servicio = new Servicio();
        servicio.setNombre(nombre);
        servicio.setDescripcion(descripcion);
        servicio.setPrecio(new BigDecimal(precio));
        servicio.setDuracionMinutos(duracion);
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