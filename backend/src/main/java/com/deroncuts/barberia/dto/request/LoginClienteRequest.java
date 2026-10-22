package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LoginClienteRequest {

    @NotBlank(message = "El correo o teléfono es obligatorio")
    private String identificador;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    public String getIdentificador() {
        return identificador;
    }

    public void setIdentificador(String identificador) {
        this.identificador = identificador;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
