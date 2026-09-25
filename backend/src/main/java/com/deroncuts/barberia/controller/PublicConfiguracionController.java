package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.ConfiguracionDto;
import com.deroncuts.barberia.service.ConfiguracionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicConfiguracionController {

    private final ConfiguracionService configuracionService;

    public PublicConfiguracionController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @GetMapping("/configuracion")
    public ConfiguracionDto obtener() {
        return configuracionService.obtener();
    }
}