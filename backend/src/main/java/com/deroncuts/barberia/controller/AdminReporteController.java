package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.service.ReporteService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reportes")
public class AdminReporteController {

    private final ReporteService reportes;

    public AdminReporteController(ReporteService reportes) {
        this.reportes = reportes;
    }

    /** PDF de la semana que contiene {@code desde} (por defecto, la semana pasada). */
    @GetMapping("/semanal")
    public ResponseEntity<byte[]> semanal(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde) {
        LocalDate lunes = desde == null ? ReporteService.lunesSemanaPasada() : desde;
        byte[] pdf = reportes.generar(lunes);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("reporte-" + lunes + ".pdf").build().toString())
                .body(pdf);
    }

    /** Envía ahora el reporte al correo configurado (para probar o reenviar). */
    @PostMapping("/semanal/enviar")
    public Map<String, String> enviar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde) {
        String destino = reportes.enviar(desde == null ? ReporteService.lunesSemanaPasada() : desde);
        return Map.of("destino", destino);
    }
}
