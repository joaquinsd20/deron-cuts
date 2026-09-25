package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class ReprogramarRequest {

    @NotNull(message = "La nueva fecha y hora es obligatoria")
    private LocalDateTime fechaHoraInicio;

    public LocalDateTime getFechaHoraInicio() {
        return fechaHoraInicio;
    }

    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) {
        this.fechaHoraInicio = fechaHoraInicio;
    }
}