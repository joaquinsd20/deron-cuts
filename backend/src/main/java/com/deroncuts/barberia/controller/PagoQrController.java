package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.model.ArchivoBinario;
import com.deroncuts.barberia.service.ArchivoService;
import com.deroncuts.barberia.service.ConfiguracionService;
import com.deroncuts.barberia.dto.ConfiguracionDto;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/** QR de pago del negocio y comprobantes que suben los clientes al reservar. */
@RestController
public class PagoQrController {

    private final ArchivoService archivos;
    private final ConfiguracionService configuracion;

    public PagoQrController(ArchivoService archivos, ConfiguracionService configuracion) {
        this.archivos = archivos;
        this.configuracion = configuracion;
    }

    @GetMapping("/api/public/pagos/qr")
    public ResponseEntity<byte[]> qr() {
        ArchivoBinario a = archivos.obtener(ArchivoService.QR_PAGO);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(a.getContentType()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .body(a.getDatos());
    }

    @PostMapping("/api/admin/configuracion/qr")
    public ConfiguracionDto subirQr(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        archivos.guardar(ArchivoService.QR_PAGO, archivo.getBytes(), archivo.getContentType());
        configuracion.refrescar();
        return configuracion.obtener();
    }

    /** Captura del pago de una reserva. Solo el barbero (ruta /api/admin). */
    @GetMapping("/api/admin/citas/{id}/comprobante")
    public ResponseEntity<byte[]> comprobante(@PathVariable Long id) {
        ArchivoBinario a = archivos.obtener(ArchivoBinario.comprobante(id));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(a.getContentType()))
                .cacheControl(CacheControl.noStore())
                .body(a.getDatos());
    }
}
