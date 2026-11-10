package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.dto.CitaDto;
import com.deroncuts.barberia.dto.ClienteDto;
import com.deroncuts.barberia.dto.request.CrearCitaClienteRequest;
import com.deroncuts.barberia.model.Cliente;
import com.deroncuts.barberia.service.CitaService;
import com.deroncuts.barberia.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cliente")
public class ClienteController {

    private final ClienteService clienteService;
    private final CitaService citaService;
    private final com.deroncuts.barberia.service.CuentaService cuentaService;

    public ClienteController(ClienteService clienteService, CitaService citaService,
                             com.deroncuts.barberia.service.CuentaService cuentaService) {
        this.clienteService = clienteService;
        this.citaService = citaService;
        this.cuentaService = cuentaService;
    }

    @GetMapping("/perfil")
    public ClienteDto perfil(Authentication authentication) {
        return clienteService.perfil(authentication.getName());
    }

    @GetMapping("/citas")
    public List<CitaDto> citas(Authentication authentication) {
        Cliente cliente = clienteService.obtenerPorEmail(authentication.getName());
        return citaService.listarPorCliente(cliente.getId());
    }

    @PostMapping("/citas")
    public ResponseEntity<CitaDto> crear(Authentication authentication,
                                         @Valid @RequestBody CrearCitaClienteRequest request) {
        Cliente cliente = clienteService.obtenerPorEmail(authentication.getName());
        CitaDto cita = citaService.crearParaCliente(cliente, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cita);
    }

    @org.springframework.web.bind.annotation.PutMapping("/password")
    public ResponseEntity<Void> cambiarPassword(Authentication authentication,
                                                @Valid @RequestBody com.deroncuts.barberia.dto.request.CambiarPasswordRequest request) {
        cuentaService.cambiarPasswordCliente(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }

    public record ReportePago(String metodoPago, String numeroOperacion, String comprobante) {
    }

    /** Pagar (o reenviar el pago de) el adelanto de una cita ya creada. */
    @PostMapping("/citas/{id}/pago")
    public CitaDto reportarPago(Authentication authentication,
                                @org.springframework.web.bind.annotation.PathVariable Long id,
                                @RequestBody ReportePago r) {
        Cliente cliente = clienteService.obtenerPorEmail(authentication.getName());
        return citaService.reportarPagoCliente(cliente, id, r.metodoPago(), r.numeroOperacion(), r.comprobante());
    }

    @org.springframework.web.bind.annotation.PatchMapping("/citas/{id}/cancelar")
    public CitaDto cancelar(Authentication authentication,
                            @org.springframework.web.bind.annotation.PathVariable Long id) {
        Cliente cliente = clienteService.obtenerPorEmail(authentication.getName());
        return citaService.cancelarPorCliente(cliente, id);
    }
}
