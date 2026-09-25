package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.DisponibilidadResponse;
import com.deroncuts.barberia.service.DisponibilidadService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/public")
public class PublicDisponibilidadController {

    private final DisponibilidadService disponibilidadService;

    public PublicDisponibilidadController(DisponibilidadService disponibilidadService) {
        this.disponibilidadService = disponibilidadService;
    }

    @GetMapping("/disponibilidad")
    public DisponibilidadResponse obtenerDisponibilidad(
            @RequestParam("fecha") LocalDate fecha,
            @RequestParam("servicioId") Long servicioId) {
        return disponibilidadService.obtenerHorariosDisponibles(fecha, servicioId);
    }
}