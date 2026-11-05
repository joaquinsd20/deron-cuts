package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.EstadoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(LocalDateTime inicio, LocalDateTime fin);

    List<Cita> findByFechaHoraInicioBetweenAndEstadoInOrderByFechaHoraInicioAsc(
            LocalDateTime inicio, LocalDateTime fin, List<EstadoCita> estados);

    List<Cita> findByEstadoOrderByFechaHoraInicioAsc(EstadoCita estado);

    List<Cita> findByFechaHoraInicioAfterOrderByFechaHoraInicioAsc(LocalDateTime desde);

    List<Cita> findByClienteIdOrderByFechaHoraInicioDesc(Long clienteId);

    boolean existsByFechaHoraInicioLessThanAndFechaHoraFinGreaterThanAndEstadoIn(
            LocalDateTime fin, LocalDateTime inicio, List<EstadoCita> estados);

    boolean existsByFechaHoraInicioLessThanAndFechaHoraFinGreaterThanAndEstadoInAndIdNot(
            LocalDateTime fin, LocalDateTime inicio, List<EstadoCita> estados, Long id);

    long countByFechaHoraInicioBetween(LocalDateTime inicio, LocalDateTime fin);

    long countByEstado(EstadoCita estado);

    boolean existsByServicioId(Long servicioId);

    List<Cita> findByFechaHoraInicioBetweenAndEstadoOrderByFechaHoraInicioAsc(
            LocalDateTime inicio, LocalDateTime fin, EstadoCita estado);

    List<Cita> findByPagadaTrueAndFechaPagoBetweenOrderByFechaPagoDesc(
            LocalDateTime inicio, LocalDateTime fin);

    List<Cita> findByPagadaTrue();

    List<Cita> findByEstadoInAndAvisoPrevioEnviadoFalseAndFechaHoraInicioBetween(
            List<EstadoCita> estados, LocalDateTime desde, LocalDateTime hasta);

    List<Cita> findByAdelantoPagadoTrueAndFechaAdelantoBetween(LocalDateTime inicio, LocalDateTime fin);

    long countByPagadaTrue();

    boolean existsByNombreCliente(String nombreCliente);

    @Query("select coalesce(sum(c.montoPagado), 0) from Cita c " +
            "where c.pagada = true and c.fechaPago between :inicio and :fin")
    BigDecimal sumMontoPagadoEntre(@Param("inicio") LocalDateTime inicio,
                                   @Param("fin") LocalDateTime fin);
}