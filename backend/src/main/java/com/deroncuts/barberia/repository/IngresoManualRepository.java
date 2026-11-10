package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.IngresoManual;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface IngresoManualRepository extends JpaRepository<IngresoManual, Long> {

    List<IngresoManual> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    List<IngresoManual> findByClienteId(Long clienteId);
}
