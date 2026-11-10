package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.ClienteDto;
import com.deroncuts.barberia.dto.ClienteLoginResponse;
import com.deroncuts.barberia.dto.request.GoogleLoginRequest;
import com.deroncuts.barberia.dto.request.LoginClienteRequest;
import com.deroncuts.barberia.dto.request.RegistrarClienteRequest;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.exception.ConflictException;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.Cliente;
import com.deroncuts.barberia.repository.ClienteRepository;
import com.deroncuts.barberia.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenService googleTokenService;

    public ClienteService(ClienteRepository clienteRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          GoogleTokenService googleTokenService) {
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenService = googleTokenService;
    }

    @Transactional
    public ClienteLoginResponse registrar(RegistrarClienteRequest request) {
        String email = normalizarEmail(request.getEmail());
        String telefono = normalizarTelefono(request.getTelefono());

        if (clienteRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Ya existe una cuenta con ese correo");
        }
        // Un cliente "externo" (creado por el barbero, sin cuenta) que ahora se registra
        // con su teléfono recupera su ficha e historial en vez de chocar con el duplicado.
        Cliente externo = clienteRepository.findByTelefono(telefono)
                .filter(ClienteService::esExterno)
                .orElse(null);
        if (externo == null && clienteRepository.existsByTelefono(telefono)) {
            throw new ConflictException("Ya existe una cuenta con ese teléfono");
        }
        if (request.getFechaNacimiento() == null || !request.getFechaNacimiento().isBefore(LocalDate.now())) {
            throw new BusinessException("La fecha de nacimiento debe estar en el pasado");
        }

        Cliente cliente = externo != null ? externo : new Cliente();
        cliente.setNombre(request.getNombre().trim());
        cliente.setEmail(email);
        cliente.setTelefono(telefono);
        cliente.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        cliente.setFechaNacimiento(request.getFechaNacimiento());
        cliente.setActivo(true);
        clienteRepository.save(cliente);

        return respuesta(cliente);
    }

    @Transactional(readOnly = true)
    public ClienteLoginResponse login(LoginClienteRequest request) {
        String identificador = request.getIdentificador().trim();
        Cliente cliente = identificador.contains("@")
                ? clienteRepository.findByEmailIgnoreCase(normalizarEmail(identificador)).orElse(null)
                : clienteRepository.findByTelefono(normalizarTelefono(identificador)).orElse(null);

        if (cliente == null || cliente.getPasswordHash() == null
                || !passwordEncoder.matches(request.getPassword(), cliente.getPasswordHash())) {
            throw new BusinessException("Correo, teléfono o contraseña incorrectos");
        }
        if (!cliente.isActivo()) {
            throw new BusinessException("Esta cuenta está desactivada");
        }

        return respuesta(cliente);
    }

    @Transactional
    public ClienteLoginResponse google(GoogleLoginRequest request) {
        GoogleTokenService.GoogleUser google = googleTokenService.verificar(request.getCredential());
        String email = normalizarEmail(google.email());

        Cliente cliente = clienteRepository.findByGoogleId(google.id())
                .orElseGet(() -> clienteRepository.findByEmailIgnoreCase(email).orElse(null));

        if (cliente == null) {
            if (request.getTelefono() == null || request.getTelefono().isBlank()
                    || request.getFechaNacimiento() == null) {
                throw new BusinessException(
                        "Para crear tu cuenta con Google, completa tu teléfono y fecha de nacimiento");
            }
            String telefono = normalizarTelefono(request.getTelefono());
            Cliente externo = clienteRepository.findByTelefono(telefono)
                    .filter(ClienteService::esExterno)
                    .orElse(null);
            if (externo == null && clienteRepository.existsByTelefono(telefono)) {
                throw new ConflictException("Ya existe una cuenta con ese teléfono");
            }
            if (!request.getFechaNacimiento().isBefore(LocalDate.now())) {
                throw new BusinessException("La fecha de nacimiento debe estar en el pasado");
            }

            cliente = externo != null ? externo : new Cliente();
            cliente.setNombre(limitar(google.nombre(), 120));
            cliente.setEmail(email);
            cliente.setTelefono(telefono);
            cliente.setFechaNacimiento(request.getFechaNacimiento());
            cliente.setGoogleId(google.id());
            cliente.setActivo(true);
        } else {
            if (cliente.getGoogleId() != null && !cliente.getGoogleId().equals(google.id())) {
                throw new ConflictException("Ese correo ya está vinculado a otra cuenta de Google");
            }
            if (!cliente.isActivo()) {
                throw new BusinessException("Esta cuenta está desactivada");
            }
            cliente.setGoogleId(google.id());
        }

        clienteRepository.save(cliente);
        return respuesta(cliente);
    }

    @Transactional(readOnly = true)
    public ClienteDto perfil(String email) {
        return ClienteDto.from(obtenerPorEmail(email));
    }

    @Transactional(readOnly = true)
    public Cliente obtenerPorEmail(String email) {
        return clienteRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));
    }

    /** Creado por el barbero desde el panel: aún no tiene forma de iniciar sesión. */
    public static boolean esExterno(Cliente c) {
        return (c.getPasswordHash() == null || c.getPasswordHash().isBlank()) && c.getGoogleId() == null;
    }

    /** Alta de un cliente externo desde el panel (sin cuenta; correo y cumpleaños opcionales). */
    @Transactional
    public Cliente crearExterno(String nombre, String telefono, String email, LocalDate fechaNacimiento) {
        if (nombre == null || nombre.isBlank()) {
            throw new BusinessException("Escribe el nombre del cliente");
        }
        String tel = normalizarTelefono(telefono == null ? "" : telefono);
        if (tel.replaceAll("\\D", "").length() < 6) {
            throw new BusinessException("Escribe un teléfono válido");
        }
        if (clienteRepository.existsByTelefono(tel)) {
            throw new ConflictException("Ya existe un cliente con ese teléfono");
        }
        String correo = (email == null || email.isBlank()) ? null : normalizarEmail(email);
        if (correo != null && clienteRepository.existsByEmailIgnoreCase(correo)) {
            throw new ConflictException("Ya existe un cliente con ese correo");
        }
        if (fechaNacimiento != null && !fechaNacimiento.isBefore(LocalDate.now())) {
            throw new BusinessException("La fecha de nacimiento debe estar en el pasado");
        }
        Cliente c = new Cliente();
        c.setNombre(limitar(nombre.trim(), 120));
        c.setTelefono(tel);
        c.setEmail(correo);
        c.setFechaNacimiento(fechaNacimiento);
        c.setActivo(true);
        return clienteRepository.save(c);
    }

    private ClienteLoginResponse respuesta(Cliente cliente) {
        String token = jwtService.generarToken(cliente.getEmail(), "CLIENTE");
        return new ClienteLoginResponse(token, ClienteDto.from(cliente));
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizarTelefono(String telefono) {
        if (telefono == null) {
            return "";
        }
        String limpio = telefono.replaceAll("[^0-9]", "");
        if (limpio.length() < 6) {
            throw new BusinessException("El teléfono no es válido");
        }
        return limpio;
    }

    private String limitar(String valor, int max) {
        if (valor == null) {
            return "";
        }
        return valor.length() <= max ? valor : valor.substring(0, max);
    }
}
