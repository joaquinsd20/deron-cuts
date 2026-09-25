package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.CitaDto;
import com.deroncuts.barberia.dto.PagosResumen;
import com.deroncuts.barberia.service.CitaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/pagos")
public class AdminPagoController {

    private final CitaService citaService;

    public AdminPagoController(CitaService citaService) {
        this.citaService = citaService;
    }

    @GetMapping("/resumen")
    public PagosResumen resumen() {
        return citaService.resumenPagos();
    }

    @GetMapping
    public List<CitaDto> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) String metodo) {
        return citaService.listarPagos(desde, hasta, metodo);
    }
}