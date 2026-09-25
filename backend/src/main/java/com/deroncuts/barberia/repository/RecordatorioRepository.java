package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.EstadoRecordatorio;
import com.deroncuts.barberia.model.Recordatorio;
import com.deroncuts.barberia.model.TipoRecordatorio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface RecordatorioRepository extends JpaRepository<Recordatorio, Long> {

    List<Recordatorio> findByEstadoAndProgramadoParaLessThanEqualOrderByProgramadoParaAsc(
            EstadoRecordatorio estado, LocalDateTime fecha);

    List<Recordatorio> findByEstadoOrderByProgramadoParaDesc(EstadoRecordatorio estado);

    List<Recordatorio> findByEstadoInOrderByProgramadoParaDesc(List<EstadoRecordatorio> estados);

    List<Recordatorio> findByCitaIdAndEstadoAndTipo(Long citaId, EstadoRecordatorio estado, TipoRecordatorio tipo);

    long countByEstado(EstadoRecordatorio estado);
}