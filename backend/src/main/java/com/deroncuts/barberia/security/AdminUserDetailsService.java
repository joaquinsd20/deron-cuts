package com.deroncuts.barberia.security;

import com.deroncuts.barberia.model.UsuarioAdmin;
import com.deroncuts.barberia.repository.UsuarioAdminRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    private final UsuarioAdminRepository usuarioAdminRepository;

    public AdminUserDetailsService(UsuarioAdminRepository usuarioAdminRepository) {
        this.usuarioAdminRepository = usuarioAdminRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UsuarioAdmin admin = usuarioAdminRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
        return User.withUsername(admin.getUsername())
                .password(admin.getPasswordHash())
                .roles(admin.getRol())
                .disabled(!admin.isActivo())
                .build();
    }
}