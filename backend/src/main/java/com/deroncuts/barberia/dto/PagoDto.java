package com.deroncuts.barberia.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Un ingreso de dinero: el adelanto de una cita o el cobro de su saldo.
 * Una misma cita puede generar dos movimientos (adelanto por Yape + saldo en efectivo).
 */
public class PagoDto {

    private String id;            // "A-12" (adelanto) / "S-12" (saldo)
    private Long citaId;
    private String concepto;      // ADELANTO | SALDO
    private LocalDateTime fechaPago;
    private String metodoPago;
    private BigDecimal montoPagado;
    private String nombreCliente;
    private String nombreServicio;

    public static PagoDto de(String concepto, Long citaId, LocalDateTime fecha, String metodo,
                             BigDecimal monto, String cliente, String servicio) {
        PagoDto p = new PagoDto();
        p.id = (concepto.equals("ADELANTO") ? "A-" : "S-") + citaId;
        p.citaId = citaId;
        p.concepto = concepto;
        p.fechaPago = fecha;
        p.metodoPago = metodo;
        p.montoPagado = monto;
        p.nombreCliente = cliente;
        p.nombreServicio = servicio;
        return p;
    }

    /** Ingreso registrado a mano por el barbero (id "M-…", sin cita asociada). */
    public static PagoDto manual(Long ingresoId, LocalDateTime fecha, String metodo, BigDecimal monto,
                                 String titulo, String concepto) {
        PagoDto p = new PagoDto();
        p.id = "M-" + ingresoId;
        p.concepto = "MANUAL";
        p.fechaPago = fecha;
        p.metodoPago = metodo;
        p.montoPagado = monto;
        p.nombreCliente = titulo;
        p.nombreServicio = concepto;
        return p;
    }

    public String getId() { return id; }
    public Long getCitaId() { return citaId; }
    public String getConcepto() { return concepto; }
    public LocalDateTime getFechaPago() { return fechaPago; }
    public String getMetodoPago() { return metodoPago; }
    public BigDecimal getMontoPagado() { return montoPagado; }
    public String getNombreCliente() { return nombreCliente; }
    public String getNombreServicio() { return nombreServicio; }
}
