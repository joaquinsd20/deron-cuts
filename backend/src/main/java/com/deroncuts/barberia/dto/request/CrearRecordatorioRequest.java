package com.deroncuts.barberia.dto.request;

import com.deroncuts.barberia.model.CanalRecordatorio;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class CrearRecordatorioRequest {

    @NotBlank(message = "El mensaje es obligatorio")
    @Size(max = 500, message = "El mensaje no puede superar 500 caracteres")
    private String mensaje;

    @Size(max = 120, message = "El destinatario no puede superar 120 caracteres")
    private String destinatarioNombre;

    @Size(max = 30, message = "El teléfono no puede superar 30 caracteres")
    private String destinatarioTelefono;

    private LocalDateTime programadoPara;

    @NotNull(message = "Indica el canal del recordatorio")
    private CanalRecordatorio canal;

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getDestinatarioNombre() {
        return destinatarioNombre;
    }

    public void setDestinatarioNombre(String destinatarioNombre) {
        this.destinatarioNombre = destinatarioNombre;
    }

    public String getDestinatarioTelefono() {
        return destinatarioTelefono;
    }

    public void setDestinatarioTelefono(String destinatarioTelefono) {
        this.destinatarioTelefono = destinatarioTelefono;
    }

    public LocalDateTime getProgramadoPara() {
        return programadoPara;
    }

    public void setProgramadoPara(LocalDateTime programadoPara) {
        this.programadoPara = programadoPara;
    }

    public CanalRecordatorio getCanal() {
        return canal;
    }

    public void setCanal(CanalRecordatorio canal) {
        this.canal = canal;
    }
}