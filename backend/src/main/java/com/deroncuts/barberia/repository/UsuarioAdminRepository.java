package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.UsuarioAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioAdminRepository extends JpaRepository<UsuarioAdmin, Long> {

    Optional<UsuarioAdmin> findByUsername(String username);

    boolean existsByUsername(String username);
}