package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.ServicioDto;
import com.deroncuts.barberia.service.ServicioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicServicioController {

    private final ServicioService servicioService;

    public PublicServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @GetMapping("/servicios")
    public List<ServicioDto> listarActivos() {
        return servicioService.listarActivos();
    }
}