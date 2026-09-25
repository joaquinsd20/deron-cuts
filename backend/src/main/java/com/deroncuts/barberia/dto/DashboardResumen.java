package com.deroncuts.barberia.dto;

import java.math.BigDecimal;

public class DashboardResumen {

    private long citasHoy;
    private long pendientes;
    private long confirmadas;
    private long completadas;
    private long canceladas;
    private BigDecimal gananciasHoy;
    private CitaDto proximaCita;

    public long getCitasHoy() {
        return citasHoy;
    }

    public void setCitasHoy(long citasHoy) {
        this.citasHoy = citasHoy;
    }

    public long getPendientes() {
        return pendientes;
    }

    public void setPendientes(long pendientes) {
        this.pendientes = pendientes;
    }

    public long getConfirmadas() {
        return confirmadas;
    }

    public void setConfirmadas(long confirmadas) {
        this.confirmadas = confirmadas;
    }

    public long getCompletadas() {
        return completadas;
    }

    public void setCompletadas(long completadas) {
        this.completadas = completadas;
    }

    public long getCanceladas() {
        return canceladas;
    }

    public void setCanceladas(long canceladas) {
        this.canceladas = canceladas;
    }

    public BigDecimal getGananciasHoy() {
        return gananciasHoy;
    }

    public void setGananciasHoy(BigDecimal gananciasHoy) {
        this.gananciasHoy = gananciasHoy;
    }

    public CitaDto getProximaCita() {
        return proximaCita;
    }

    public void setProximaCita(CitaDto proximaCita) {
        this.proximaCita = proximaCita;
    }
}