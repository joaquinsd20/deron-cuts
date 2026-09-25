package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServicioRepository extends JpaRepository<Servicio, Long> {

    List<Servicio> findByActivoTrueOrderByIdAsc();

    List<Servicio> findAllByOrderByIdAsc();
}