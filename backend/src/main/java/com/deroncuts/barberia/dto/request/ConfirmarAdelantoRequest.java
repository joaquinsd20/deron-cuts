package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotNull;

public class ConfirmarAdelantoRequest {

    @NotNull(message = "Debes indicar si el adelanto fue recibido")
    private Boolean pagado;

    private String metodoPago;

    public Boolean getPagado() {
        return pagado;
    }

    public void setPagado(Boolean pagado) {
        this.pagado = pagado;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }
}
