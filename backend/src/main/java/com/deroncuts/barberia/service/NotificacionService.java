package com.deroncuts.barberia.service;

import com.deroncuts.barberia.model.ConfiguracionNegocio;
import com.deroncuts.barberia.model.PushSuscripcion;
import com.deroncuts.barberia.repository.ConfiguracionNegocioRepository;
import com.deroncuts.barberia.repository.PushSuscripcionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Notificaciones push (Web Push) al celular del barbero y de los clientes.
 * Gratis y sin servicios externos: el navegador entrega el aviso aunque la página esté
 * cerrada. Las claves VAPID se generan una sola vez y se guardan en la base.
 */
@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);
    public static final String ADMIN = "ADMIN";
    public static final String CLIENTE = "CLIENTE";

    private final PushSuscripcionRepository suscripciones;
    private final ConfiguracionNegocioRepository configuraciones;
    private final ObjectMapper objectMapper;
    // Un hilo aparte: enviar avisos nunca hace esperar a quien reserva o al barbero.
    private final ExecutorService envios = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "push-envios");
        t.setDaemon(true);
        return t;
    });

    private volatile PushService pushService;
    private volatile String clavePublica;

    public NotificacionService(PushSuscripcionRepository suscripciones,
                               ConfiguracionNegocioRepository configuraciones,
                               ObjectMapper objectMapper) {
        this.suscripciones = suscripciones;
        this.configuraciones = configuraciones;
        this.objectMapper = objectMapper;
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public String clavePublica() {
        inicializar();
        return clavePublica;
    }

    @Transactional
    public void suscribir(String endpoint, String p256dh, String auth, String rol, Long clienteId) {
        if (endpoint == null || endpoint.isBlank() || p256dh == null || auth == null) {
            throw new com.deroncuts.barberia.exception.BusinessException("Suscripción inválida");
        }
        PushSuscripcion s = suscripciones.findByEndpoint(endpoint).orElseGet(PushSuscripcion::new);
        s.setEndpoint(endpoint);
        s.setP256dh(p256dh);
        s.setAuth(auth);
        s.setRol(rol);
        s.setClienteId(clienteId);
        suscripciones.save(s);
    }

    @Transactional
    public void desuscribir(String endpoint) {
        if (endpoint != null) {
            suscripciones.deleteByEndpoint(endpoint);
        }
    }

    public void avisarAdmins(String titulo, String cuerpo, String url) {
        enviar(suscripciones.findByRol(ADMIN), titulo, cuerpo, url);
    }

    public void avisarCliente(Long clienteId, String titulo, String cuerpo, String url) {
        if (clienteId == null) return;
        enviar(suscripciones.findByRolAndClienteId(CLIENTE, clienteId), titulo, cuerpo, url);
    }

    /** Cuántos dispositivos del barbero recibirán avisos (para la pantalla de ayuda). */
    public long dispositivosAdmin() {
        return suscripciones.findByRol(ADMIN).size();
    }

    private void enviar(List<PushSuscripcion> destinos, String titulo, String cuerpo, String url) {
        if (destinos.isEmpty()) return;
        // Copiamos los datos: la entidad no se usa fuera de la transacción.
        List<String[]> datos = destinos.stream()
                .map(s -> new String[]{s.getEndpoint(), s.getP256dh(), s.getAuth()})
                .toList();
        byte[] payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "title", titulo,
                    "body", cuerpo,
                    "url", url == null ? "/" : url)).getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            return;
        }
        envios.submit(() -> {
            try {
                inicializar();
            } catch (Exception e) {
                log.warn("Push no disponible: {}", e.getMessage());
                return;
            }
            for (String[] d : datos) {
                try {
                    var resp = pushService.send(new Notification(d[0], d[1], d[2], payload));
                    int codigo = resp.getStatusLine().getStatusCode();
                    if (codigo == 404 || codigo == 410) {
                        // El usuario desinstaló o quitó el permiso: se limpia.
                        suscripciones.findByEndpoint(d[0]).ifPresent(suscripciones::delete);
                    } else if (codigo >= 400) {
                        log.warn("Push rechazado ({}) para {}", codigo, d[0].substring(0, Math.min(60, d[0].length())));
                    }
                } catch (Exception e) {
                    log.warn("No se pudo enviar push: {}", e.getMessage());
                }
            }
        });
    }

    private synchronized void inicializar() {
        if (pushService != null) return;
        try {
            ConfiguracionNegocio config = configuraciones.findAll().stream()
                    .min(java.util.Comparator.comparing(ConfiguracionNegocio::getId))
                    .orElseThrow(() -> new IllegalStateException("Sin configuración"));
            if (config.getVapidPublica() == null || config.getVapidPrivada() == null) {
                KeyPairGenerator gen = KeyPairGenerator.getInstance("ECDH", BouncyCastleProvider.PROVIDER_NAME);
                gen.initialize(ECNamedCurveTable.getParameterSpec("prime256v1"));
                KeyPair par = gen.generateKeyPair();
                Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
                config.setVapidPublica(b64.encodeToString(((ECPublicKey) par.getPublic()).getQ().getEncoded(false)));
                config.setVapidPrivada(b64.encodeToString(((ECPrivateKey) par.getPrivate()).getD().toByteArray()));
                configuraciones.save(config);
                log.info("Claves VAPID generadas para notificaciones push.");
            }
            PushService ps = new PushService(config.getVapidPublica(), config.getVapidPrivada());
            ps.setSubject("mailto:" + (config.getEmail() == null || config.getEmail().isBlank()
                    ? "hola@deroncuts.com" : config.getEmail()));
            clavePublica = config.getVapidPublica();
            pushService = ps;
        } catch (Exception e) {
            throw new IllegalStateException("No se pudieron preparar las notificaciones: " + e.getMessage(), e);
        }
    }
}
