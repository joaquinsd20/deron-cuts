package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.ConfiguracionNegocio;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface ConfiguracionNegocioRepository extends JpaRepository<ConfiguracionNegocio, Long> {

    /**
     * SELECT ... FOR UPDATE sobre la fila de configuración. Se usa como candado
     * para serializar la creación/reprogramación de citas y evitar que dos
     * clientes reserven el mismo horario al mismo tiempo.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ConfiguracionNegocio> findFirstByOrderByIdAsc();
}
