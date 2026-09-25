package com.deroncuts.barberia.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CitaDto {

    private Long id;
    private Long servicioId;
    private String nombreServicio;
    private BigDecimal precioServicio;
    private Integer duracionMinutos;
    private String nombreCliente;
    private String telefonoWhatsapp;
    private String email;
    private String notas;
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private String estado;
    private LocalDateTime createdAt;
    private boolean pagada;
    private String metodoPago;
    private BigDecimal montoPagado;
    private LocalDateTime fechaPago;

    public static CitaDto from(com.deroncuts.barberia.model.Cita cita) {
        CitaDto dto = new CitaDto();
        dto.setId(cita.getId());
        dto.setServicioId(cita.getServicio().getId());
        dto.setNombreServicio(cita.getServicio().getNombre());
        dto.setPrecioServicio(cita.getServicio().getPrecio());
        dto.setDuracionMinutos(cita.getServicio().getDuracionMinutos());
        dto.setNombreCliente(cita.getNombreCliente());
        dto.setTelefonoWhatsapp(cita.getTelefonoWhatsapp());
        dto.setEmail(cita.getEmail());
        dto.setNotas(cita.getNotas());
        dto.setFechaHoraInicio(cita.getFechaHoraInicio());
        dto.setFechaHoraFin(cita.getFechaHoraFin());
        dto.setEstado(cita.getEstado().name());
        dto.setCreatedAt(cita.getCreatedAt());
        dto.setPagada(cita.isPagada());
        dto.setMetodoPago(cita.getMetodoPago() != null ? cita.getMetodoPago().name() : null);
        dto.setMontoPagado(cita.getMontoPagado());
        dto.setFechaPago(cita.getFechaPago());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getServicioId() {
        return servicioId;
    }

    public void setServicioId(Long servicioId) {
        this.servicioId = servicioId;
    }

    public String getNombreServicio() {
        return nombreServicio;
    }

    public void setNombreServicio(String nombreServicio) {
        this.nombreServicio = nombreServicio;
    }

    public BigDecimal getPrecioServicio() {
        return precioServicio;
    }

    public void setPrecioServicio(BigDecimal precioServicio) {
        this.precioServicio = precioServicio;
    }

    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
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

    public LocalDateTime getFechaHoraFin() {
        return fechaHoraFin;
    }

    public void setFechaHoraFin(LocalDateTime fechaHoraFin) {
        this.fechaHoraFin = fechaHoraFin;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isPagada() {
        return pagada;
    }

    public void setPagada(boolean pagada) {
        this.pagada = pagada;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public BigDecimal getMontoPagado() {
        return montoPagado;
    }

    public void setMontoPagado(BigDecimal montoPagado) {
        this.montoPagado = montoPagado;
    }

    public LocalDateTime getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }
}