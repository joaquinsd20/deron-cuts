package com.deroncuts.barberia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

/**
 * Foto de un servicio subida desde el panel. Se guarda en la base (tabla aparte
 * para no cargar los bytes al listar servicios) porque el disco de Render es efímero.
 */
@Entity
@Table(name = "servicio_imagenes")
public class ServicioImagen {

    @Id
    @Column(name = "servicio_id")
    private Long servicioId;

    @Lob
    @Column(nullable = false, columnDefinition = "MEDIUMBLOB")
    private byte[] datos;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    public Long getServicioId() {
        return servicioId;
    }

    public void setServicioId(Long servicioId) {
        this.servicioId = servicioId;
    }

    public byte[] getDatos() {
        return datos;
    }

    public void setDatos(byte[] datos) {
        this.datos = datos;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
