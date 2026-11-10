package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class CrearCitaRequest {

    @NotNull(message = "Debes elegir un servicio")
    private Long servicioId;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
    private String nombreCliente;

    @NotBlank(message = "El WhatsApp/teléfono es obligatorio")
    @Size(max = 30, message = "El teléfono no puede superar 30 caracteres")
    @Pattern(regexp = "\\+?[0-9\\s()\\-]{6,30}", message = "Formato de teléfono no válido")
    private String telefonoWhatsapp;

    @Email(message = "El correo no es válido")
    @Size(max = 150, message = "El correo no puede superar 150 caracteres")
    private String email;

    @Size(max = 2000, message = "Las notas no pueden superar 2000 caracteres")
    private String notas;

    @NotNull(message = "Debes elegir fecha y hora")
    private LocalDateTime fechaHoraInicio;

    public Long getServicioId() {
        return servicioId;
    }

    public void setServicioId(Long servicioId) {
        this.servicioId = servicioId;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public String getTelefonoWhatsapp() {
        return telefonoWhatsapp;
    }

    public void setTelefonoWhatsapp(String telefonoWhatsapp) {
        this.telefonoWhatsapp = telefonoWhatsapp;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public LocalDateTime getFechaHoraInicio() {
        return fechaHoraInicio;
    }

    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) {
        this.fechaHoraInicio = fechaHoraInicio;
    }

    // ---- Solo para citas agendadas desde el panel ----

    /** Cliente existente (si se indica, se usan su nombre, teléfono y cumpleaños). */
    private Long clienteId;

    /** true si el cliente ya pagó el adelanto: la cita queda confirmada. */
    private Boolean adelantoPagado;

    private String metodoAdelanto;

    /** true para confirmar la cita sin adelanto (cliente de confianza). */
    private Boolean confirmar;

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public Boolean getAdelantoPagado() { return adelantoPagado; }
    public void setAdelantoPagado(Boolean adelantoPagado) { this.adelantoPagado = adelantoPagado; }
    public String getMetodoAdelanto() { return metodoAdelanto; }
    public void setMetodoAdelanto(String metodoAdelanto) { this.metodoAdelanto = metodoAdelanto; }
    public Boolean getConfirmar() { return confirmar; }
    public void setConfirmar(Boolean confirmar) { this.confirmar = confirmar; }
}
