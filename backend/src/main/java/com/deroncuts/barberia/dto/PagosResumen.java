package com.deroncuts.barberia.dto;

import java.math.BigDecimal;
import java.util.List;

public class PagosResumen {

    private BigDecimal total;
    private BigDecimal totalHoy;
    private BigDecimal totalSemana;
    private BigDecimal totalMes;
    private long cantidad;
    private List<MetodoPagoResumen> desglose;

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getTotalHoy() {
        return totalHoy;
    }

    public void setTotalHoy(BigDecimal totalHoy) {
        this.totalHoy = totalHoy;
    }

    public BigDecimal getTotalSemana() {
        return totalSemana;
    }

    public void setTotalSemana(BigDecimal totalSemana) {
        this.totalSemana = totalSemana;
    }

    public BigDecimal getTotalMes() {
        return totalMes;
    }

    public void setTotalMes(BigDecimal totalMes) {
        this.totalMes = totalMes;
    }

    public long getCantidad() {
        return cantidad;
    }

    public void setCantidad(long cantidad) {
        this.cantidad = cantidad;
    }

    public List<MetodoPagoResumen> getDesglose() {
        return desglose;
    }

    public void setDesglose(List<MetodoPagoResumen> desglose) {
        this.desglose = desglose;
    }
}