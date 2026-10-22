package com.deroncuts.barberia.service;

import com.deroncuts.barberia.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class GoogleTokenService {

    private final String clientId;
    private final RestClient restClient = RestClient.create();

    public GoogleTokenService(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId;
    }

    public GoogleUser verificar(String credential) {
        if (clientId == null || clientId.isBlank()) {
            throw new BusinessException("El inicio de sesión con Google aún no está configurado");
        }

        Map<String, Object> info;
        try {
            info = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("oauth2.googleapis.com")
                            .path("/tokeninfo")
                            .queryParam("id_token", credential)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });
        } catch (Exception e) {
            throw new BusinessException("No pudimos validar tu cuenta de Google");
        }

        if (info == null) {
            throw new BusinessException("No pudimos validar tu cuenta de Google");
        }

        String audiencia = texto(info.get("aud"));
        if (audiencia == null || !audiencia.equals(clientId)) {
            throw new BusinessException("El token de Google no pertenece a esta aplicación");
        }

        String email = texto(info.get("email"));
        String googleId = texto(info.get("sub"));
        boolean verificado = Boolean.parseBoolean(texto(info.get("email_verified")));

        if (email == null || googleId == null || !verificado) {
            throw new BusinessException("Tu correo de Google no está verificado");
        }

        String nombre = texto(info.get("name"));
        if (nombre == null || nombre.isBlank()) {
            String nombres = texto(info.get("given_name"));
            String apellidos = texto(info.get("family_name"));
            nombre = ((nombres == null ? "" : nombres) + " " + (apellidos == null ? "" : apellidos)).trim();
        }
        if (nombre == null || nombre.isBlank()) {
            nombre = email.substring(0, email.indexOf('@'));
        }

        return new GoogleUser(googleId, email, nombre);
    }

    private String texto(Object valor) {
        if (valor == null) {
            return null;
        }
        String texto = String.valueOf(valor).trim();
        return texto.isEmpty() ? null : texto;
    }

    public record GoogleUser(String id, String email, String nombre) {
    }
}
