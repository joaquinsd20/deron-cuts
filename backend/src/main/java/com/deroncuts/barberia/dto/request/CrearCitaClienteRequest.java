package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class CrearCitaClienteRequest {

    @NotNull(message = "Debes elegir un servicio")
    private Long servicioId;

    @Size(max = 2000, message = "Las notas no pueden superar 2000 caracteres")
    private String notas;

    @NotNull(message = "Debes elegir fecha y hora")
    private LocalDateTime fechaHoraInicio;

    public Long getServicioId() {
        return servicioId;
    }

    public void setServicioId(Long servicioId) {
        this.servicioId = servicioId;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public LocalDateTime getFechaHoraInicio() {
        return fechaHoraInicio;
    }

    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) {
        this.fechaHoraInicio = fechaHoraInicio;
    }
}
