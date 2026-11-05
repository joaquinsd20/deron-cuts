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

    public AdminClienteController(CuentaService cuentaService) {
        this.cuentaService = cuentaService;
    }

    @GetMapping("/clientes")
    public List<com.deroncuts.barberia.dto.ClienteAdminDto> listar(@RequestParam(required = false) String q) {
        return cuentaService.listarClientes(q);
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
