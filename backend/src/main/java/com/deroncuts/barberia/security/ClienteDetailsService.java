package com.deroncuts.barberia.security;

import com.deroncuts.barberia.model.Cliente;
import com.deroncuts.barberia.repository.ClienteRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class ClienteDetailsService {

    private final ClienteRepository clienteRepository;

    public ClienteDetailsService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public UserDetails cargarPorEmail(String email) {
        Cliente cliente = clienteRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Cliente no encontrado"));
        String password = cliente.getPasswordHash() == null ? "" : cliente.getPasswordHash();
        return User.withUsername(cliente.getEmail())
                .password(password)
                .roles("CLIENTE")
                .disabled(!cliente.isActivo())
                .build();
    }
}
