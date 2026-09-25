package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.LoginResponse;
import com.deroncuts.barberia.dto.request.LoginRequest;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final ConfiguracionService configuracionService;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       ConfiguracionService configuracionService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.configuracionService = configuracionService;
    }

    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            String username = authentication.getName();
            String token = jwtService.generarToken(username);
            String nombreBarbero = configuracionService.obtener().getNombreBarbero();
            String nombreNegocio = configuracionService.obtener().getNombreNegocio();
            return new LoginResponse(token, username, nombreBarbero, nombreNegocio);
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new BusinessException("Credenciales inválidas");
        }
    }
}