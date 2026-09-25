package com.deroncuts.barberia.dto;

public class EventoCita {

    private String accion;
    private CitaDto cita;

    public EventoCita() {
    }

    public EventoCita(String accion, CitaDto cita) {
        this.accion = accion;
        this.cita = cita;
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public CitaDto getCita() {
        return cita;
    }

    public void setCita(CitaDto cita) {
        this.cita = cita;
    }
}