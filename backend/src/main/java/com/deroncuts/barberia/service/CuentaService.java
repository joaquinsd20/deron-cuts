package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.ClienteDto;
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

    public CuentaService(ClienteRepository clienteRepository,
                         UsuarioAdminRepository usuarioAdminRepository,
                         PasswordEncoder passwordEncoder) {
        this.clienteRepository = clienteRepository;
        this.usuarioAdminRepository = usuarioAdminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<ClienteDto> listarClientes(String q) {
        String filtro = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return clienteRepository.findAll().stream()
                .filter(c -> filtro.isEmpty()
                        || contiene(c.getNombre(), filtro)
                        || contiene(c.getEmail(), filtro)
                        || contiene(c.getTelefono(), filtro))
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(100)
                .map(ClienteDto::from)
                .toList();
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
