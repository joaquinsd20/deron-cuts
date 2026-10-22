package com.deroncuts.barberia.dto;

public class ClienteLoginResponse {

    private String token;
    private ClienteDto cliente;

    public ClienteLoginResponse(String token, ClienteDto cliente) {
        this.token = token;
        this.cliente = cliente;
    }

    public String getToken() {
        return token;
    }

    public ClienteDto getCliente() {
        return cliente;
    }
}
