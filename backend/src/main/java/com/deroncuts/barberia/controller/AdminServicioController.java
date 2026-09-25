package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.ServicioDto;
import com.deroncuts.barberia.dto.request.ActualizarServicioRequest;
import com.deroncuts.barberia.dto.request.CrearServicioRequest;
import com.deroncuts.barberia.service.ServicioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/servicios")
public class AdminServicioController {

    private final ServicioService servicioService;

    public AdminServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @GetMapping
    public List<ServicioDto> listar() {
        return servicioService.listarTodos();
    }

    @PostMapping
    public ResponseEntity<ServicioDto> crear(@Valid @RequestBody CrearServicioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servicioService.crear(request));
    }

    @PutMapping("/{id}")
    public ServicioDto actualizar(@PathVariable Long id, @Valid @RequestBody ActualizarServicioRequest request) {
        return servicioService.actualizar(id, request);
    }

    @PatchMapping("/{id}/activo")
    public ServicioDto cambiarActivo(@PathVariable Long id, @RequestParam boolean activo) {
        return servicioService.cambiarActivo(id, activo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        servicioService.cambiarActivo(id, false);
        return ResponseEntity.noContent().build();
    }
}