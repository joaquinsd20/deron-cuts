package com.deroncuts.barberia.dto;

import java.time.LocalDate;
import java.util.List;

public class DisponibilidadResponse {

    private LocalDate fecha;
    private Long servicioId;
    private List<String> horarios;

    public DisponibilidadResponse(LocalDate fecha, Long servicioId, List<String> horarios) {
        this.fecha = fecha;
        this.servicioId = servicioId;
        this.horarios = horarios;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public Long getServicioId() {
        return servicioId;
    }

    public List<String> getHorarios() {
        return horarios;
    }
}