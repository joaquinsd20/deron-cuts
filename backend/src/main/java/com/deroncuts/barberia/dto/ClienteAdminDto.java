package com.deroncuts.barberia.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Ficha del cliente para el barbero: datos, cumpleaños y hábitos de visita. */
public class ClienteAdminDto {

    public Long id;
    public String nombre;
    public String email;
    public String telefono;
    public boolean tienePassword;
    public boolean googleVinculado;
    public LocalDateTime registradoEn;

    public LocalDate fechaNacimiento;
    public LocalDate proximoCumple;
    public Integer diasParaCumple;
    public Integer edadQueCumple;

    public long visitas;            // citas completadas
    public long reservas;           // todas menos canceladas
    public long canceladas;
    public LocalDateTime ultimaVisita;
    public LocalDateTime proximaCita;
    public Integer frecuenciaDias;  // promedio de días entre visitas (null con < 2 visitas)
    public Integer diasSinVenir;
    public String servicioFavorito;
    public BigDecimal totalGastado;
}
