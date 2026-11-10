package com.deroncuts.barberia.controller;


import com.deroncuts.barberia.dto.request.CambiarPasswordRequest;
import com.deroncuts.barberia.service.CuentaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminClienteController {

    private final CuentaService cuentaService;
    private final com.deroncuts.barberia.service.ClienteService clienteService;

    public AdminClienteController(CuentaService cuentaService,
                                  com.deroncuts.barberia.service.ClienteService clienteService) {
        this.clienteService = clienteService;
        this.cuentaService = cuentaService;
    }

    @GetMapping("/clientes")
    public List<com.deroncuts.barberia.dto.ClienteAdminDto> listar(@RequestParam(required = false) String q) {
        return cuentaService.listarClientes(q);
    }

    public record NuevoClienteRequest(String nombre, String telefono, String email,
                                      java.time.LocalDate fechaNacimiento) {
    }

    /** Cliente externo creado por el barbero (sin cuenta en la web). */
    @PostMapping("/clientes")
    public com.deroncuts.barberia.dto.ClienteAdminDto crear(@RequestBody NuevoClienteRequest r) {
        var c = clienteService.crearExterno(r.nombre(), r.telefono(), r.email(), r.fechaNacimiento());
        return cuentaService.listarClientes(c.getTelefono()).stream()
                .filter(x -> x.id.equals(c.getId())).findFirst().orElseThrow();
    }

    @PostMapping("/clientes/{id}/restablecer-password")
    public Map<String, String> restablecer(@PathVariable Long id) {
        return Map.of("passwordTemporal", cuentaService.restablecerPasswordCliente(id));
    }

    @PutMapping("/cuenta/password")
    public ResponseEntity<Void> cambiarMiPassword(Authentication authentication,
                                                  @Valid @RequestBody CambiarPasswordRequest request) {
        cuentaService.cambiarPasswordAdmin(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }
}
