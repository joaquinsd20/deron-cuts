package com.deroncuts.barberia.dto.request;

import com.deroncuts.barberia.dto.ConfiguracionDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public class ActualizarConfiguracionRequest {

    @NotBlank(message = "El nombre del negocio es obligatorio")
    @Size(max = 80, message = "El nombre del negocio no puede superar 80 caracteres")
    private String nombreNegocio;

    @NotBlank(message = "El nombre del barbero es obligatorio")
    @Size(max = 80, message = "El nombre del barbero no puede superar 80 caracteres")
    private String nombreBarbero;

    @Size(max = 30, message = "El teléfono no puede superar 30 caracteres")
    private String telefono;

    @Size(max = 150, message = "El email no puede superar 150 caracteres")
    private String email;

    @Size(max = 255, message = "La dirección no puede superar 255 caracteres")
    private String direccion;

    @Size(max = 500, message = "El enlace del mapa no puede superar 500 caracteres")
    private String enlaceMapa;

    @Size(max = 150, message = "El Instagram no puede superar 150 caracteres")
    private String instagram;

    @Size(max = 150, message = "El TikTok no puede superar 150 caracteres")
    private String tiktok;

    @Size(max = 5000, message = "La descripción no puede superar 5000 caracteres")
    private String descripcionBarbero;

    private Map<String, ConfiguracionDto.HorarioDia> horario;

    public String getNombreNegocio() {
        return nombreNegocio;
    }

    public void setNombreNegocio(String nombreNegocio) {
        this.nombreNegocio = nombreNegocio;
    }

    public String getNombreBarbero() {
        return nombreBarbero;
    }

    public void setNombreBarbero(String nombreBarbero) {
        this.nombreBarbero = nombreBarbero;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getEnlaceMapa() {
        return enlaceMapa;
    }

    public void setEnlaceMapa(String enlaceMapa) {
        this.enlaceMapa = enlaceMapa;
    }

    public String getInstagram() {
        return instagram;
    }

    public void setInstagram(String instagram) {
        this.instagram = instagram;
    }

    public String getTiktok() {
        return tiktok;
    }

    public void setTiktok(String tiktok) {
        this.tiktok = tiktok;
    }

    public String getDescripcionBarbero() {
        return descripcionBarbero;
    }

    public void setDescripcionBarbero(String descripcionBarbero) {
        this.descripcionBarbero = descripcionBarbero;
    }

    public Map<String, ConfiguracionDto.HorarioDia> getHorario() {
        return horario;
    }

    public void setHorario(Map<String, ConfiguracionDto.HorarioDia> horario) {
        this.horario = horario;
    }
}