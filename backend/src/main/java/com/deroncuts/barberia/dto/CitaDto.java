package com.deroncuts.barberia.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CitaDto {

    private Long id;
    private Long servicioId;
    private String nombreServicio;
    private BigDecimal precioServicio;
    private Integer duracionMinutos;
    private Long clienteId;
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
    private boolean descuentoCumpleanos;
    private BigDecimal precioFinal;
    private BigDecimal adelantoMonto;
    private boolean adelantoPagado;
    private boolean adelantoAplicado;
    private String metodoAdelanto;
    private LocalDateTime fechaAdelanto;
    private boolean tardanzaAplicada;
    private BigDecimal penalidadTardanza;
    private BigDecimal totalAPagar;
    private BigDecimal creditoAdelanto;
    private BigDecimal totalPagado;
    private BigDecimal saldoPendiente;

    public static CitaDto from(com.deroncuts.barberia.model.Cita cita) {
        BigDecimal precioFinal = cita.getPrecioFinal() != null
                ? cita.getPrecioFinal()
                : cita.getServicio().getPrecio();
        BigDecimal penalidad = cita.getPenalidadTardanza() != null
                ? cita.getPenalidadTardanza()
                : BigDecimal.ZERO;
        BigDecimal adelanto = cita.getAdelantoMonto() != null
                ? cita.getAdelantoMonto()
                : BigDecimal.ZERO;
        BigDecimal montoPagado = cita.getMontoPagado() != null
                ? cita.getMontoPagado()
                : BigDecimal.ZERO;
        BigDecimal credito = cita.isAdelantoPagado() && cita.isAdelantoAplicado()
                ? adelanto
                : BigDecimal.ZERO;
        BigDecimal totalAPagar = precioFinal.add(penalidad);
        BigDecimal saldo = totalAPagar.subtract(credito).subtract(montoPagado).max(BigDecimal.ZERO);

        CitaDto dto = new CitaDto();
        dto.setId(cita.getId());
        dto.setServicioId(cita.getServicio().getId());
        dto.setNombreServicio(cita.getServicio().getNombre());
        dto.setPrecioServicio(cita.getServicio().getPrecio());
        dto.setDuracionMinutos(cita.getServicio().getDuracionMinutos());
        dto.setClienteId(cita.getCliente() != null ? cita.getCliente().getId() : null);
        dto.setNombreCliente(cita.getNombreCliente());
        dto.setTelefonoWhatsapp(cita.getTelefonoWhatsapp());
        dto.setEmail(cita.getEmail());
        dto.setNotas(cita.getNotas());
        dto.setFechaHoraInicio(cita.getFechaHoraInicio());
        dto.setFechaHoraFin(cita.getFechaHoraFin());
        dto.setEstado(cita.getEstado().name());
        dto.setCreatedAt(cita.getCreatedAt());
        dto.setPagada(cita.isPagada());
        dto.setMetodoPago(cita.getMetodoPago());
        dto.setMontoPagado(cita.getMontoPagado());
        dto.setFechaPago(cita.getFechaPago());
        dto.setDescuentoCumpleanos(cita.isDescuentoCumpleanos());
        dto.setPrecioFinal(precioFinal);
        dto.setAdelantoMonto(adelanto);
        dto.setAdelantoPagado(cita.isAdelantoPagado());
        dto.setAdelantoAplicado(cita.isAdelantoAplicado());
        dto.setMetodoAdelanto(cita.getMetodoAdelanto());
        dto.setFechaAdelanto(cita.getFechaAdelanto());
        dto.setTardanzaAplicada(cita.isTardanzaAplicada());
        dto.setPenalidadTardanza(penalidad);
        dto.setTotalAPagar(totalAPagar);
        dto.setCreditoAdelanto(credito);
        dto.setTotalPagado((cita.isAdelantoPagado() ? adelanto : BigDecimal.ZERO).add(montoPagado));
        dto.setSaldoPendiente(cita.isPagada() ? BigDecimal.ZERO : saldo);
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

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
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

    public boolean isDescuentoCumpleanos() {
        return descuentoCumpleanos;
    }

    public void setDescuentoCumpleanos(boolean descuentoCumpleanos) {
        this.descuentoCumpleanos = descuentoCumpleanos;
    }

    public BigDecimal getPrecioFinal() {
        return precioFinal;
    }

    public void setPrecioFinal(BigDecimal precioFinal) {
        this.precioFinal = precioFinal;
    }

    public BigDecimal getAdelantoMonto() {
        return adelantoMonto;
    }

    public void setAdelantoMonto(BigDecimal adelantoMonto) {
        this.adelantoMonto = adelantoMonto;
    }

    public boolean isAdelantoPagado() {
        return adelantoPagado;
    }

    public void setAdelantoPagado(boolean adelantoPagado) {
        this.adelantoPagado = adelantoPagado;
    }

    public boolean isAdelantoAplicado() {
        return adelantoAplicado;
    }

    public void setAdelantoAplicado(boolean adelantoAplicado) {
        this.adelantoAplicado = adelantoAplicado;
    }

    public String getMetodoAdelanto() {
        return metodoAdelanto;
    }

    public void setMetodoAdelanto(String metodoAdelanto) {
        this.metodoAdelanto = metodoAdelanto;
    }

    public LocalDateTime getFechaAdelanto() {
        return fechaAdelanto;
    }

    public void setFechaAdelanto(LocalDateTime fechaAdelanto) {
        this.fechaAdelanto = fechaAdelanto;
    }

    public boolean isTardanzaAplicada() {
        return tardanzaAplicada;
    }

    public void setTardanzaAplicada(boolean tardanzaAplicada) {
        this.tardanzaAplicada = tardanzaAplicada;
    }

    public BigDecimal getPenalidadTardanza() {
        return penalidadTardanza;
    }

    public void setPenalidadTardanza(BigDecimal penalidadTardanza) {
        this.penalidadTardanza = penalidadTardanza;
    }

    public BigDecimal getTotalAPagar() {
        return totalAPagar;
    }

    public void setTotalAPagar(BigDecimal totalAPagar) {
        this.totalAPagar = totalAPagar;
    }

    public BigDecimal getCreditoAdelanto() {
        return creditoAdelanto;
    }

    public void setCreditoAdelanto(BigDecimal creditoAdelanto) {
        this.creditoAdelanto = creditoAdelanto;
    }

    public BigDecimal getTotalPagado() {
        return totalPagado;
    }

    public void setTotalPagado(BigDecimal totalPagado) {
        this.totalPagado = totalPagado;
    }

    public BigDecimal getSaldoPendiente() {
        return saldoPendiente;
    }

    public void setSaldoPendiente(BigDecimal saldoPendiente) {
        this.saldoPendiente = saldoPendiente;
    }
}