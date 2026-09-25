package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.RecordatorioDto;
import com.deroncuts.barberia.dto.request.CrearRecordatorioRequest;
import com.deroncuts.barberia.model.EstadoRecordatorio;
import com.deroncuts.barberia.service.RecordatorioService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/recordatorios")
public class AdminRecordatorioController {

    private final RecordatorioService recordatorioService;

    public AdminRecordatorioController(RecordatorioService recordatorioService) {
        this.recordatorioService = recordatorioService;
    }

    @GetMapping
    public List<RecordatorioDto> listar(@RequestParam(required = false) EstadoRecordatorio estado) {
        return recordatorioService.listar(estado);
    }

    @PostMapping
    public RecordatorioDto crear(@Valid @RequestBody CrearRecordatorioRequest request) {
        return recordatorioService.crearManual(request);
    }

    @PatchMapping("/{id}/enviar")
    public RecordatorioDto enviarAhora(@PathVariable Long id) {
        return recordatorioService.enviarAhora(id);
    }

    @PatchMapping("/{id}/cancelar")
    public RecordatorioDto cancelar(@PathVariable Long id) {
        return recordatorioService.cancelar(id);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        recordatorioService.eliminar(id);
    }
}