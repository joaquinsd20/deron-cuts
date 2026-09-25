package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public class RegistrarPagoRequest {

    @NotBlank(message = "El método de pago es obligatorio")
    private String metodoPago;

    private BigDecimal monto;

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }
}