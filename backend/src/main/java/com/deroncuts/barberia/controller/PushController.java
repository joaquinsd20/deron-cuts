package com.deroncuts.barberia.controller;

import com.deroncuts.barberia.model.Cliente;
import com.deroncuts.barberia.service.ClienteService;
import com.deroncuts.barberia.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Alta/baja de dispositivos para notificaciones push. */
@RestController
public class PushController {

    private final NotificacionService notificaciones;
    private final ClienteService clienteService;

    public PushController(NotificacionService notificaciones, ClienteService clienteService) {
        this.notificaciones = notificaciones;
        this.clienteService = clienteService;
    }

    /** Formato estándar de PushSubscription.toJSON(): { endpoint, keys: { p256dh, auth } } */
    public record Suscripcion(String endpoint, Map<String, String> keys) {
        String p256dh() { return keys == null ? null : keys.get("p256dh"); }
        String auth() { return keys == null ? null : keys.get("auth"); }
    }

    @GetMapping("/api/public/push/clave")
    public Map<String, String> clave() {
        return Map.of("publicKey", notificaciones.clavePublica());
    }

    @PostMapping("/api/public/push/baja")
    public ResponseEntity<Void> baja(@RequestBody Suscripcion s) {
        notificaciones.desuscribir(s.endpoint());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/admin/push/suscripcion")
    public ResponseEntity<Void> suscribirAdmin(@RequestBody Suscripcion s) {
        notificaciones.suscribir(s.endpoint(), s.p256dh(), s.auth(), NotificacionService.ADMIN, null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/admin/push/prueba")
    public Map<String, Long> pruebaAdmin() {
        notificaciones.avisarAdmins("🔔 Notificaciones activadas",
                "Así te llegarán las nuevas reservas y cancelaciones.", "/citas");
        return Map.of("dispositivos", notificaciones.dispositivosAdmin());
    }

    @PostMapping("/api/cliente/push/suscripcion")
    public ResponseEntity<Void> suscribirCliente(Authentication auth, @RequestBody Suscripcion s) {
        Cliente cliente = clienteService.obtenerPorEmail(auth.getName());
        notificaciones.suscribir(s.endpoint(), s.p256dh(), s.auth(), NotificacionService.CLIENTE, cliente.getId());
        notificaciones.avisarCliente(cliente.getId(), "🔔 Avisos activados",
                "Te avisaremos cuando tu cita se confirme y antes de que empiece.", "/cuenta");
        return ResponseEntity.noContent().build();
    }
}
