package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.ConfiguracionDto;
import com.deroncuts.barberia.dto.request.ActualizarConfiguracionRequest;
import com.deroncuts.barberia.service.ConfiguracionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/configuracion")
public class AdminConfiguracionController {

    private final ConfiguracionService configuracionService;

    public AdminConfiguracionController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @GetMapping
    public ConfiguracionDto obtener() {
        return configuracionService.obtener();
    }

    @PutMapping
    public ConfiguracionDto actualizar(@Valid @RequestBody ActualizarConfiguracionRequest request) {
        return configuracionService.actualizar(request);
    }
}