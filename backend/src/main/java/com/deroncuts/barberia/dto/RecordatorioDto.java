package com.deroncuts.barberia.dto;

import com.deroncuts.barberia.model.CanalRecordatorio;
import com.deroncuts.barberia.model.EstadoRecordatorio;
import com.deroncuts.barberia.model.Recordatorio;
import com.deroncuts.barberia.model.TipoRecordatorio;

import java.time.LocalDateTime;

public class RecordatorioDto {

    private Long id;
    private Long citaId;
    private TipoRecordatorio tipo;
    private CanalRecordatorio canal;
    private EstadoRecordatorio estado;
    private LocalDateTime programadoPara;
    private String mensaje;
    private String destinatarioNombre;
    private String destinatarioTelefono;
    private String servicioNombre;
    private LocalDateTime fechaHoraCita;
    private LocalDateTime enviadoEn;
    private LocalDateTime createdAt;

    public static RecordatorioDto from(Recordatorio r) {
        RecordatorioDto dto = new RecordatorioDto();
        dto.setId(r.getId());
        dto.setCitaId(r.getCitaId());
        dto.setTipo(r.getTipo());
        dto.setCanal(r.getCanal());
        dto.setEstado(r.getEstado());
        dto.setProgramadoPara(r.getProgramadoPara());
        dto.setMensaje(r.getMensaje());
        dto.setDestinatarioNombre(r.getDestinatarioNombre());
        dto.setDestinatarioTelefono(r.getDestinatarioTelefono());
        dto.setServicioNombre(r.getServicioNombre());
        dto.setFechaHoraCita(r.getFechaHoraCita());
        dto.setEnviadoEn(r.getEnviadoEn());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCitaId() {
        return citaId;
    }

    public void setCitaId(Long citaId) {
        this.citaId = citaId;
    }

    public TipoRecordatorio getTipo() {
        return tipo;
    }

    public void setTipo(TipoRecordatorio tipo) {
        this.tipo = tipo;
    }

    public CanalRecordatorio getCanal() {
        return canal;
    }

    public void setCanal(CanalRecordatorio canal) {
        this.canal = canal;
    }

    public EstadoRecordatorio getEstado() {
        return estado;
    }

    public void setEstado(EstadoRecordatorio estado) {
        this.estado = estado;
    }

    public LocalDateTime getProgramadoPara() {
        return programadoPara;
    }

    public void setProgramadoPara(LocalDateTime programadoPara) {
        this.programadoPara = programadoPara;
    }

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

    public String getServicioNombre() {
        return servicioNombre;
    }

    public void setServicioNombre(String servicioNombre) {
        this.servicioNombre = servicioNombre;
    }

    public LocalDateTime getFechaHoraCita() {
        return fechaHoraCita;
    }

    public void setFechaHoraCita(LocalDateTime fechaHoraCita) {
        this.fechaHoraCita = fechaHoraCita;
    }

    public LocalDateTime getEnviadoEn() {
        return enviadoEn;
    }

    public void setEnviadoEn(LocalDateTime enviadoEn) {
        this.enviadoEn = enviadoEn;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}