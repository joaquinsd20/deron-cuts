package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CambiarPasswordRequest {

    /** Contraseña actual. Puede ir vacía solo si la cuenta aún no tiene contraseña (entró con Google). */
    private String actual;

    @NotBlank(message = "Escribe la nueva contraseña")
    @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres")
    private String nueva;

    public String getActual() {
        return actual;
    }

    public void setActual(String actual) {
        this.actual = actual;
    }

    public String getNueva() {
        return nueva;
    }

    public void setNueva(String nueva) {
        this.nueva = nueva;
    }
}
