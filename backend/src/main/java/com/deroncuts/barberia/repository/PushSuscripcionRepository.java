package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.PushSuscripcion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushSuscripcionRepository extends JpaRepository<PushSuscripcion, Long> {

    Optional<PushSuscripcion> findByEndpoint(String endpoint);

    List<PushSuscripcion> findByRol(String rol);

    List<PushSuscripcion> findByRolAndClienteId(String rol, Long clienteId);

    void deleteByEndpoint(String endpoint);
}
