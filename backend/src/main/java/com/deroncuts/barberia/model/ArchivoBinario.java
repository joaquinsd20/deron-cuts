package com.deroncuts.barberia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Imágenes guardadas en la base (el disco de Render es efímero):
 * el QR de pago ("QR_PAGO") y los comprobantes de las reservas ("COMPROBANTE_<idCita>").
 */
@Entity
@Table(name = "archivos_binarios")
public class ArchivoBinario {

    @Id
    @Column(length = 60)
    private String clave;

    @Lob
    @Column(nullable = false, columnDefinition = "MEDIUMBLOB")
    private byte[] datos;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(nullable = false)
    private LocalDateTime actualizado;

    public static String comprobante(Long citaId) {
        return "COMPROBANTE_" + citaId;
    }

    public String getClave() { return clave; }
    public void setClave(String clave) { this.clave = clave; }
    public byte[] getDatos() { return datos; }
    public void setDatos(byte[] datos) { this.datos = datos; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public LocalDateTime getActualizado() { return actualizado; }
    public void setActualizado(LocalDateTime actualizado) { this.actualizado = actualizado; }
}
