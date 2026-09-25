package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.CitaDto;
import com.deroncuts.barberia.dto.DashboardResumen;
import com.deroncuts.barberia.dto.request.CambiarEstadoRequest;
import com.deroncuts.barberia.dto.request.RegistrarPagoRequest;
import com.deroncuts.barberia.dto.request.ReprogramarRequest;
import com.deroncuts.barberia.model.EstadoCita;
import com.deroncuts.barberia.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/citas")
public class AdminCitaController {

    private final CitaService citaService;

    public AdminCitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @GetMapping
    public List<CitaDto> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) EstadoCita estado) {
        if (desde != null || hasta != null) {
            return citaService.listarEntre(desde, hasta, estado);
        }
        return citaService.listar(fecha, estado);
    }

    @GetMapping("/{id}")
    public CitaDto obtener(@PathVariable Long id) {
        return citaService.obtener(id);
    }

    @PostMapping("/{id}/pago")
    public CitaDto registrarPago(@PathVariable Long id, @Valid @RequestBody RegistrarPagoRequest request) {
        return citaService.registrarPago(id, request);
    }

    @PatchMapping("/{id}/estado")
    public CitaDto cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambiarEstadoRequest request) {
        return citaService.cambiarEstado(id, request);
    }

    @PutMapping("/{id}")
    public CitaDto reprogramar(@PathVariable Long id, @Valid @RequestBody ReprogramarRequest request) {
        return citaService.reprogramar(id, request);
    }

    @GetMapping("/resumen")
    public DashboardResumen resumen() {
        return citaService.resumen();
    }
}