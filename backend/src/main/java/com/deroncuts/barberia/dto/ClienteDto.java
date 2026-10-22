package com.deroncuts.barberia.dto;

import com.deroncuts.barberia.model.Cliente;

import java.time.LocalDate;

public class ClienteDto {

    private Long id;
    private String nombre;
    private String email;
    private String telefono;
    private LocalDate fechaNacimiento;
    private boolean tienePassword;
    private boolean googleVinculado;

    public static ClienteDto from(Cliente cliente) {
        ClienteDto dto = new ClienteDto();
        dto.setId(cliente.getId());
        dto.setNombre(cliente.getNombre());
        dto.setEmail(cliente.getEmail());
        dto.setTelefono(cliente.getTelefono());
        dto.setFechaNacimiento(cliente.getFechaNacimiento());
        dto.setTienePassword(cliente.getPasswordHash() != null && !cliente.getPasswordHash().isBlank());
        dto.setGoogleVinculado(cliente.getGoogleId() != null && !cliente.getGoogleId().isBlank());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public boolean isTienePassword() {
        return tienePassword;
    }

    public void setTienePassword(boolean tienePassword) {
        this.tienePassword = tienePassword;
    }

    public boolean isGoogleVinculado() {
        return googleVinculado;
    }

    public void setGoogleVinculado(boolean googleVinculado) {
        this.googleVinculado = googleVinculado;
    }
}
