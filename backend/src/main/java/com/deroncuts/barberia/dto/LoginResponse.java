package com.deroncuts.barberia.dto;

public class LoginResponse {

    private String token;
    private String username;
    private String nombreBarbero;
    private String nombreNegocio;

    public LoginResponse(String token, String username, String nombreBarbero, String nombreNegocio) {
        this.token = token;
        this.username = username;
        this.nombreBarbero = nombreBarbero;
        this.nombreNegocio = nombreNegocio;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public String getNombreBarbero() {
        return nombreBarbero;
    }

    public String getNombreNegocio() {
        return nombreNegocio;
    }
}