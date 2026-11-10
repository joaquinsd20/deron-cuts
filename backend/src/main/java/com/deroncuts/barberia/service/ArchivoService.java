package com.deroncuts.barberia.service;

import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.ArchivoBinario;
import com.deroncuts.barberia.repository.ArchivoBinarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Set;

/** Guarda y entrega imágenes pequeñas (QR de pago, comprobantes) desde la base. */
@Service
public class ArchivoService {

    public static final String QR_PAGO = "QR_PAGO";
    private static final long MAX_BYTES = 3L * 1024 * 1024;
    private static final Set<String> TIPOS = Set.of("image/jpeg", "image/png", "image/webp");

    private final ArchivoBinarioRepository repo;

    public ArchivoService(ArchivoBinarioRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void guardar(String clave, byte[] datos, String contentType) {
        if (datos == null || datos.length == 0) {
            throw new BusinessException("La imagen está vacía");
        }
        if (datos.length > MAX_BYTES) {
            throw new BusinessException("La imagen no puede superar 3 MB");
        }
        if (contentType == null || !TIPOS.contains(contentType)) {
            throw new BusinessException("La imagen debe ser JPG, PNG o WEBP");
        }
        ArchivoBinario a = repo.findById(clave).orElseGet(ArchivoBinario::new);
        a.setClave(clave);
        a.setDatos(datos);
        a.setContentType(contentType);
        a.setActualizado(LocalDateTime.now());
        repo.save(a);
    }

    /** Recibe "data:image/jpeg;base64,...." (lo que manda el navegador) y lo guarda. */
    @Transactional
    public void guardarDataUrl(String clave, String dataUrl) {
        if (dataUrl == null || !dataUrl.startsWith("data:") || !dataUrl.contains(";base64,")) {
            throw new BusinessException("La captura del pago no es válida");
        }
        String tipo = dataUrl.substring(5, dataUrl.indexOf(';'));
        byte[] datos;
        try {
            datos = Base64.getDecoder().decode(dataUrl.substring(dataUrl.indexOf(",") + 1));
        } catch (IllegalArgumentException e) {
            throw new BusinessException("La captura del pago no es válida");
        }
        guardar(clave, datos, tipo);
    }

    @Transactional(readOnly = true)
    public ArchivoBinario obtener(String clave) {
        return repo.findById(clave).orElseThrow(() -> new NotFoundException("Imagen no encontrada"));
    }

    @Transactional(readOnly = true)
    public LocalDateTime fechaDe(String clave) {
        return repo.fechaDe(clave).orElse(null);
    }

    @Transactional
    public void borrar(String clave) {
        repo.findById(clave).ifPresent(repo::delete);
    }
}
