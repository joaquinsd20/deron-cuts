package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotNull;

public class AplicarTardanzaRequest {

    @NotNull(message = "Debes indicar si aplicas la tardanza")
    private Boolean aplicar;

    public Boolean getAplicar() {
        return aplicar;
    }

    public void setAplicar(Boolean aplicar) {
        this.aplicar = aplicar;
    }
}
