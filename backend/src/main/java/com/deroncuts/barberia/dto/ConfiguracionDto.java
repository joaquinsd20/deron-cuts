package com.deroncuts.barberia.dto;

import java.util.Map;

public class ConfiguracionDto {

    private Long id;
    private String nombreNegocio;
    private String nombreBarbero;
    private String telefono;
    private String email;
    private String direccion;
    private String enlaceMapa;
    private String instagram;
    private String tiktok;
    private String descripcionBarbero;
    private Map<String, HorarioDia> horario;

    public static class HorarioDia {
        private String abre;
        private String cierra;
        private boolean activo;

        public String getAbre() {
            return abre;
        }

        public void setAbre(String abre) {
            this.abre = abre;
        }

        public String getCierra() {
            return cierra;
        }

        public void setCierra(String cierra) {
            this.cierra = cierra;
        }

        public boolean isActivo() {
            return activo;
        }

        public void setActivo(boolean activo) {
            this.activo = activo;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Map<String, HorarioDia> getHorario() {
        return horario;
    }

    public void setHorario(Map<String, HorarioDia> horario) {
        this.horario = horario;
    }
}