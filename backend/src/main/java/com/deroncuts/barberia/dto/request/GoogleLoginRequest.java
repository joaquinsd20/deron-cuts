package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class GoogleLoginRequest {

    @NotBlank(message = "El token de Google es obligatorio")
    private String credential;

    @Size(max = 30, message = "El teléfono no puede superar 30 caracteres")
    @Pattern(regexp = "\\+?[0-9\\s()\\-]{6,30}", message = "Formato de teléfono no válido")
    private String telefono;

    private LocalDate fechaNacimiento;

    public String getCredential() {
        return credential;
    }

    public void setCredential(String credential) {
        this.credential = credential;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }
}
