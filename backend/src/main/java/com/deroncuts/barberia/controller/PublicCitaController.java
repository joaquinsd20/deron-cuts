package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.CitaDto;
import com.deroncuts.barberia.dto.request.CrearCitaRequest;
import com.deroncuts.barberia.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicCitaController {

    private final CitaService citaService;

    public PublicCitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @PostMapping("/citas")
    public ResponseEntity<CitaDto> crear(@Valid @RequestBody CrearCitaRequest request) {
        CitaDto cita = citaService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cita);
    }
}