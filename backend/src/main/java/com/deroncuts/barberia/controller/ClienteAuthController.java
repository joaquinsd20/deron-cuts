package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.ClienteLoginResponse;
import com.deroncuts.barberia.dto.request.GoogleLoginRequest;
import com.deroncuts.barberia.dto.request.LoginClienteRequest;
import com.deroncuts.barberia.dto.request.RegistrarClienteRequest;
import com.deroncuts.barberia.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/cliente")
public class ClienteAuthController {

    private final ClienteService clienteService;

    public ClienteAuthController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @PostMapping("/registro")
    public ResponseEntity<ClienteLoginResponse> registrar(
            @Valid @RequestBody RegistrarClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<ClienteLoginResponse> login(
            @Valid @RequestBody LoginClienteRequest request) {
        return ResponseEntity.ok(clienteService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<ClienteLoginResponse> google(
            @Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(clienteService.google(request));
    }
}
