package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.ClienteAdminDto;
import com.deroncuts.barberia.dto.ClienteDto;
import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.EstadoCita;
import com.deroncuts.barberia.repository.CitaRepository;
import com.deroncuts.barberia.dto.request.CambiarPasswordRequest;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.Cliente;
import com.deroncuts.barberia.model.UsuarioAdmin;
import com.deroncuts.barberia.repository.ClienteRepository;
import com.deroncuts.barberia.repository.UsuarioAdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/** Contraseñas de clientes y del admin, y listado de clientes para el panel. */
@Service
public class CuentaService {

    // Sin 0/O, 1/l/I para que la clave temporal se pueda dictar o copiar sin errores.
    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ClienteRepository clienteRepository;
    private final UsuarioAdminRepository usuarioAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final CitaRepository citaRepository;

    public CuentaService(ClienteRepository clienteRepository,
                         UsuarioAdminRepository usuarioAdminRepository,
                         PasswordEncoder passwordEncoder,
                         CitaRepository citaRepository) {
        this.citaRepository = citaRepository;
        this.clienteRepository = clienteRepository;
        this.usuarioAdminRepository = usuarioAdminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<ClienteAdminDto> listarClientes(String q) {
        String filtro = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        // Una sola consulta de citas para todos (negocio pequeño: evita N+1 consultas).
        java.util.Map<Long, List<Cita>> citasPorCliente = citaRepository.findAll().stream()
                .filter(c -> c.getCliente() != null)
                .collect(java.util.stream.Collectors.groupingBy(c -> c.getCliente().getId()));
        LocalDate hoy = LocalDate.now();
        return clienteRepository.findAll().stream()
                .filter(c -> filtro.isEmpty()
                        || contiene(c.getNombre(), filtro)
                        || contiene(c.getEmail(), filtro)
                        || contiene(c.getTelefono(), filtro))
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(200)
                .map(c -> ficha(c, citasPorCliente.getOrDefault(c.getId(), List.of()), hoy))
                .toList();
    }

    private ClienteAdminDto ficha(Cliente c, List<Cita> citas, LocalDate hoy) {
        ClienteDto base = ClienteDto.from(c);
        ClienteAdminDto f = new ClienteAdminDto();
        f.id = c.getId();
        f.nombre = c.getNombre();
        f.email = c.getEmail();
        f.telefono = c.getTelefono();
        f.tienePassword = base.isTienePassword();
        f.googleVinculado = base.isGoogleVinculado();
        f.registradoEn = c.getCreatedAt();

        LocalDate nac = c.getFechaNacimiento();
        if (nac != null) {
            f.fechaNacimiento = nac;
            LocalDate cumple = proximoCumple(nac, hoy);
            f.proximoCumple = cumple;
            f.diasParaCumple = (int) java.time.temporal.ChronoUnit.DAYS.between(hoy, cumple);
            f.edadQueCumple = cumple.getYear() - nac.getYear();
        }

        List<Cita> completadas = citas.stream()
                .filter(x -> x.getEstado() == EstadoCita.COMPLETADA)
                .sorted(java.util.Comparator.comparing(Cita::getFechaHoraInicio))
                .toList();
        f.visitas = completadas.size();
        f.canceladas = citas.stream().filter(x -> x.getEstado() == EstadoCita.CANCELADA).count();
        f.reservas = citas.size() - f.canceladas;
        if (!completadas.isEmpty()) {
            LocalDateTime ultima = completadas.get(completadas.size() - 1).getFechaHoraInicio();
            f.ultimaVisita = ultima;
            f.diasSinVenir = (int) Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(ultima.toLocalDate(), hoy));
        }
        if (completadas.size() >= 2) {
            long dias = java.time.temporal.ChronoUnit.DAYS.between(
                    completadas.get(0).getFechaHoraInicio().toLocalDate(),
                    completadas.get(completadas.size() - 1).getFechaHoraInicio().toLocalDate());
            f.frecuenciaDias = (int) Math.max(1, Math.round(dias / (double) (completadas.size() - 1)));
        }
        LocalDateTime ahora = LocalDateTime.now();
        citas.stream()
                .filter(x -> (x.getEstado() == EstadoCita.PENDIENTE || x.getEstado() == EstadoCita.CONFIRMADA)
                        && x.getFechaHoraInicio().isAfter(ahora))
                .map(Cita::getFechaHoraInicio)
                .min(LocalDateTime::compareTo)
                .ifPresent(p -> f.proximaCita = p);
        citas.stream()
                .filter(x -> x.getEstado() != EstadoCita.CANCELADA && x.getServicio() != null)
                .collect(java.util.stream.Collectors.groupingBy(x -> x.getServicio().getNombre(),
                        java.util.stream.Collectors.counting()))
                .entrySet().stream()
                .max(java.util.Map.Entry.comparingByValue())
                .ifPresent(e -> f.servicioFavorito = e.getKey());
        f.totalGastado = citas.stream()
                .map(x -> (x.isAdelantoPagado() && x.getAdelantoMonto() != null ? x.getAdelantoMonto() : BigDecimal.ZERO)
                        .add(x.isPagada() && x.getMontoPagado() != null ? x.getMontoPagado() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return f;
    }

    private static LocalDate proximoCumple(LocalDate nac, LocalDate hoy) {
        for (int anio = hoy.getYear(); anio <= hoy.getYear() + 1; anio++) {
            // 29 de febrero en años no bisiestos → 28 de febrero
            LocalDate c = nac.getMonthValue() == 2 && nac.getDayOfMonth() == 29 && !java.time.Year.isLeap(anio)
                    ? LocalDate.of(anio, 2, 28)
                    : nac.withYear(anio);
            if (!c.isBefore(hoy)) return c;
        }
        return nac.withYear(hoy.getYear() + 1);
    }

    /** Genera una clave temporal para un cliente que olvidó la suya. Se devuelve una sola vez. */
    @Transactional
    public String restablecerPasswordCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));
        String temporal = generarTemporal();
        cliente.setPasswordHash(passwordEncoder.encode(temporal));
        clienteRepository.save(cliente);
        return temporal;
    }

    @Transactional
    public void cambiarPasswordCliente(String email, CambiarPasswordRequest request) {
        Cliente cliente = clienteRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));
        boolean tienePassword = cliente.getPasswordHash() != null && !cliente.getPasswordHash().isBlank();
        if (tienePassword && (request.getActual() == null
                || !passwordEncoder.matches(request.getActual(), cliente.getPasswordHash()))) {
            throw new BusinessException("La contraseña actual no es correcta");
        }
        cliente.setPasswordHash(passwordEncoder.encode(request.getNueva()));
        clienteRepository.save(cliente);
    }

    @Transactional
    public void cambiarPasswordAdmin(String username, CambiarPasswordRequest request) {
        UsuarioAdmin admin = usuarioAdminRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        if (request.getActual() == null || !passwordEncoder.matches(request.getActual(), admin.getPasswordHash())) {
            throw new BusinessException("La contraseña actual no es correcta");
        }
        admin.setPasswordHash(passwordEncoder.encode(request.getNueva()));
        // A partir de ahora manda la del panel; APP_ADMIN_PASSWORD ya no la sobrescribe.
        admin.setPasswordDesdePanel(true);
        usuarioAdminRepository.save(admin);
    }

    private static boolean contiene(String valor, String filtro) {
        return valor != null && valor.toLowerCase(Locale.ROOT).contains(filtro);
    }

    private static String generarTemporal() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(ALFABETO.charAt(RANDOM.nextInt(ALFABETO.length())));
        }
        return sb.toString();
    }
}
