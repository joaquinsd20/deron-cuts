package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.ServicioDto;
import com.deroncuts.barberia.model.ServicioImagen;
import com.deroncuts.barberia.service.ServicioService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.TimeUnit;

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

    @GetMapping("/servicios/{id}/imagen")
    public ResponseEntity<byte[]> imagen(@PathVariable Long id) {
        ServicioImagen imagen = servicioService.obtenerImagen(id);
        // La URL lleva ?v=<fecha de subida>, así que se puede cachear mucho tiempo.
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(imagen.getContentType()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .body(imagen.getDatos());
    }
}
