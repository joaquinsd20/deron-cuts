package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByEmailIgnoreCase(String email);

    Optional<Cliente> findByTelefono(String telefono);

    Optional<Cliente> findByGoogleId(String googleId);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByTelefono(String telefono);

    boolean existsByTelefonoAndIdNot(String telefono, Long id);
}
