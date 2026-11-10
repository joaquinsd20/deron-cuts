package com.deroncuts.barberia.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class CrearCitaClienteRequest {

    @NotNull(message = "Debes elegir un servicio")
    private Long servicioId;

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

    // ---- Pago del adelanto (obligatorio para guardar la reserva) ----

    /** Cómo pagó: YAPE, PLIN, … */
    @Size(max = 30)
    private String metodoPago;

    /** Número de operación que muestra Yape/Plin. */
    @Size(max = 40, message = "El número de operación es demasiado largo")
    private String numeroOperacion;

    /** Captura del pago como data URL (image/jpeg;base64,…), ya reducida en el navegador. */
    private String comprobante;

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public String getNumeroOperacion() { return numeroOperacion; }
    public void setNumeroOperacion(String numeroOperacion) { this.numeroOperacion = numeroOperacion; }
    public String getComprobante() { return comprobante; }
    public void setComprobante(String comprobante) { this.comprobante = comprobante; }
}
