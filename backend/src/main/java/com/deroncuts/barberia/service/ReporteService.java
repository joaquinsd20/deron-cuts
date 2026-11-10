package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.PagoDto;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.Cliente;
import com.deroncuts.barberia.model.ConfiguracionNegocio;
import com.deroncuts.barberia.model.EstadoCita;
import com.deroncuts.barberia.repository.CitaRepository;
import com.deroncuts.barberia.repository.ClienteRepository;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Reporte semanal en PDF (ingresos, citas, clientes) que se descarga desde el panel y
 * llega por correo cada lunes a las 8:00 (hora de Lima) con la semana anterior.
 */
@Service
public class ReporteService {

    private static final Logger log = LoggerFactory.getLogger(ReporteService.class);
    private static final Locale ES = new Locale("es", "PE");
    private static final DateTimeFormatter DIA = DateTimeFormatter.ofPattern("EEE d MMM", ES);
    private static final DateTimeFormatter DIA_HORA = DateTimeFormatter.ofPattern("EEE d MMM HH:mm", ES);
    private static final DateTimeFormatter LARGA = DateTimeFormatter.ofPattern("d 'de' MMMM yyyy", ES);

    private static final Color NEGRO = new Color(18, 18, 22);
    private static final Color GRIS = new Color(110, 110, 120);
    private static final Color FONDO = new Color(242, 242, 245);
    private static final Color VERDE = new Color(23, 128, 74);
    private static final Color ROJO = new Color(180, 40, 40);

    private final CitaService citaService;
    private final CitaRepository citaRepository;
    private final ClienteRepository clienteRepository;
    private final ConfiguracionService configuracionService;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final String remitente;

    public ReporteService(CitaService citaService,
                          CitaRepository citaRepository,
                          ClienteRepository clienteRepository,
                          ConfiguracionService configuracionService,
                          ObjectProvider<JavaMailSender> mailSender,
                          @Value("${spring.mail.username:}") String remitente) {
        this.citaService = citaService;
        this.citaRepository = citaRepository;
        this.clienteRepository = clienteRepository;
        this.configuracionService = configuracionService;
        this.mailSender = mailSender;
        this.remitente = remitente;
    }

    /** Lunes de la semana anterior a hoy (la que se reporta por defecto). */
    public static LocalDate lunesSemanaPasada() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(1);
    }

    // ---------------------------------------------------------------- PDF

    @Transactional(readOnly = true)
    public byte[] generar(LocalDate lunes) {
        LocalDate desde = lunes.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate hasta = desde.plusDays(6);
        LocalDateTime ini = desde.atStartOfDay();
        LocalDateTime fin = hasta.plusDays(1).atStartOfDay();

        List<PagoDto> pagos = citaService.listarPagos(desde, hasta, null);
        BigDecimal total = sumar(pagos);
        BigDecimal totalAnterior = sumar(citaService.listarPagos(desde.minusWeeks(1), hasta.minusWeeks(1), null));
        List<Cita> citas = citaRepository.findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(ini, fin);
        long completadas = citas.stream().filter(c -> c.getEstado() == EstadoCita.COMPLETADA).count();
        long canceladas = citas.stream().filter(c -> c.getEstado() == EstadoCita.CANCELADA).count();
        long proximaSemana = citaRepository.findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(fin, fin.plusDays(7))
                .stream().filter(c -> c.getEstado() == EstadoCita.PENDIENTE || c.getEstado() == EstadoCita.CONFIRMADA)
                .count();
        List<Cliente> clientes = clienteRepository.findAll();
        List<Cliente> nuevos = clientes.stream()
                .filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isBefore(ini) && c.getCreatedAt().isBefore(fin))
                .toList();
        ConfiguracionNegocio config = configuracionService.obtenerOMeterDefault();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titulo = new Font(Font.HELVETICA, 20, Font.BOLD, NEGRO);
        Font sub = new Font(Font.HELVETICA, 10, Font.NORMAL, GRIS);
        Font h2 = new Font(Font.HELVETICA, 12, Font.BOLD, NEGRO);
        Font normal = new Font(Font.HELVETICA, 9, Font.NORMAL, NEGRO);

        doc.add(new Paragraph(config.getNombreNegocio() + " · Reporte semanal", titulo));
        doc.add(new Paragraph("Semana del " + desde.format(LARGA) + " al " + hasta.format(LARGA)
                + "   ·   Generado el " + LocalDateTime.now().format(DIA_HORA), sub));
        doc.add(Chunk.NEWLINE);

        // --- Resumen
        PdfPTable resumen = new PdfPTable(4);
        resumen.setWidthPercentage(100);
        resumen.setSpacingAfter(14);
        String variacion = variacion(total, totalAnterior);
        tarjeta(resumen, "Ingresos de la semana", soles(total), variacion);
        tarjeta(resumen, "Citas completadas", String.valueOf(completadas),
                citas.size() + " reservas · " + canceladas + " canceladas");
        tarjeta(resumen, "Ticket promedio",
                completadas == 0 ? "—" : soles(total.divide(BigDecimal.valueOf(completadas), 2, RoundingMode.HALF_UP)),
                "ingresos / citas completadas");
        tarjeta(resumen, "Próxima semana", String.valueOf(proximaSemana), "citas ya agendadas");
        doc.add(resumen);

        // --- Por método y por concepto
        PdfPTable dos = new PdfPTable(2);
        dos.setWidthPercentage(100);
        dos.setSpacingAfter(14);
        dos.addCell(sinBorde(tablaClaveValor("Ingresos por método",
                agrupar(pagos, p -> p.getMetodoPago() == null ? "Sin método" : nombreMetodo(p.getMetodoPago())), h2, normal)));
        dos.addCell(sinBorde(tablaClaveValor("Ingresos por concepto",
                agrupar(pagos, p -> switch (p.getConcepto()) {
                    case "ADELANTO" -> "Adelantos";
                    case "SALDO" -> "Saldos cobrados";
                    default -> "Ingresos manuales";
                }), h2, normal)));
        doc.add(dos);

        // --- Servicios más pedidos
        Map<String, Long> porServicio = citas.stream()
                .filter(c -> c.getEstado() != EstadoCita.CANCELADA)
                .collect(Collectors.groupingBy(c -> c.getServicio().getNombre(), Collectors.counting()));
        doc.add(new Paragraph("Servicios más pedidos", h2));
        if (porServicio.isEmpty()) {
            doc.add(new Paragraph("Sin reservas esta semana.", normal));
        } else {
            PdfPTable t = tabla(new float[]{4, 1}, normal, "Servicio", "Reservas");
            porServicio.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .forEach(e -> fila(t, normal, e.getKey(), String.valueOf(e.getValue())));
            doc.add(t);
        }

        // --- Clientes
        doc.add(new Paragraph("Clientes", h2));
        doc.add(new Paragraph(nuevos.size() + " cliente(s) nuevo(s) esta semana"
                + (nuevos.isEmpty() ? "." : ": " + nuevos.stream().map(Cliente::getNombre).collect(Collectors.joining(", ")) + "."),
                normal));
        LocalDate hoy = LocalDate.now();
        List<String> cumples = clientes.stream()
                .filter(c -> c.getFechaNacimiento() != null)
                .map(c -> Map.entry(c, diasParaCumple(c.getFechaNacimiento(), hoy)))
                .filter(e -> e.getValue() <= 7)
                .sorted(Map.Entry.comparingByValue())
                .map(e -> e.getKey().getNombre() + " (" + hoy.plusDays(e.getValue()).format(DIA) + ")")
                .toList();
        doc.add(new Paragraph("Cumpleaños en los próximos 7 días: "
                + (cumples.isEmpty() ? "ninguno." : String.join(", ", cumples) + " — su corte es gratis esa semana."),
                normal));
        doc.add(Chunk.NEWLINE);

        // --- Detalle de ingresos
        doc.add(new Paragraph("Detalle de ingresos", h2));
        if (pagos.isEmpty()) {
            doc.add(new Paragraph("No hubo ingresos esta semana.", normal));
        } else {
            PdfPTable t = tabla(new float[]{2.2f, 3, 2.6f, 1.6f, 1.4f}, normal,
                    "Fecha", "Cliente / concepto", "Detalle", "Método", "Monto");
            pagos.stream().sorted(Comparator.comparing(PagoDto::getFechaPago)).forEach(p -> fila(t, normal,
                    p.getFechaPago().format(DIA_HORA),
                    nz(p.getNombreCliente()),
                    ("ADELANTO".equals(p.getConcepto()) ? "Adelanto · " : "SALDO".equals(p.getConcepto()) ? "Saldo · " : "Manual · ")
                            + nz(p.getNombreServicio()),
                    nombreMetodo(p.getMetodoPago()),
                    soles(p.getMontoPagado())));
            fila(t, new Font(Font.HELVETICA, 9, Font.BOLD, NEGRO), "", "", "", "Total", soles(total));
            doc.add(t);
        }

        doc.close();
        return out.toByteArray();
    }

    // ---------------------------------------------------------------- Correo

    /** Envía el reporte de la semana que empieza en {@code lunes}. Devuelve el destinatario. */
    public String enviar(LocalDate lunes) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || remitente == null || remitente.isBlank()) {
            throw new BusinessException(
                    "El correo aún no está configurado: agrega MAIL_USERNAME y MAIL_PASSWORD en Render");
        }
        ConfiguracionNegocio config = configuracionService.obtenerOMeterDefault();
        String destino = config.getCorreoReportes() != null && !config.getCorreoReportes().isBlank()
                ? config.getCorreoReportes() : remitente;
        LocalDate desde = lunes.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        byte[] pdf = generar(desde);
        try {
            MimeMessage msg = sender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(remitente, config.getNombreNegocio());
            h.setTo(destino);
            h.setSubject(config.getNombreNegocio() + " · Reporte semanal del " + desde.format(DIA)
                    + " al " + desde.plusDays(6).format(DIA));
            h.setText("Hola " + config.getNombreBarbero() + ",\n\nTe adjuntamos el reporte de la semana del "
                    + desde.format(LARGA) + " al " + desde.plusDays(6).format(LARGA)
                    + ": ingresos por método, citas, servicios más pedidos, clientes nuevos y cumpleaños próximos.\n\n"
                    + "— Panel de " + config.getNombreNegocio());
            h.addAttachment("reporte-" + desde + ".pdf", new ByteArrayResource(pdf), "application/pdf");
            sender.send(msg);
            return destino;
        } catch (Exception e) {
            log.warn("No se pudo enviar el reporte: {}", e.getMessage());
            throw new BusinessException("No se pudo enviar el correo: revisa MAIL_USERNAME y MAIL_PASSWORD (contraseña de aplicación)");
        }
    }

    /** Cada lunes a las 8:00 (Lima) llega el reporte de la semana anterior. */
    @Scheduled(cron = "0 0 8 * * MON", zone = "America/Lima")
    public void envioSemanal() {
        if (remitente == null || remitente.isBlank()) {
            log.info("Reporte semanal no enviado: falta configurar MAIL_USERNAME/MAIL_PASSWORD.");
            return;
        }
        try {
            String destino = enviar(lunesSemanaPasada());
            log.info("Reporte semanal enviado a {}", destino);
        } catch (Exception e) {
            log.warn("Falló el envío del reporte semanal: {}", e.getMessage());
        }
    }

    // ---------------------------------------------------------------- Ayudas

    private static BigDecimal sumar(List<PagoDto> pagos) {
        return pagos.stream().map(PagoDto::getMontoPagado).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static Map<String, BigDecimal> agrupar(List<PagoDto> pagos, java.util.function.Function<PagoDto, String> clave) {
        Map<String, BigDecimal> m = new LinkedHashMap<>();
        pagos.forEach(p -> m.merge(clave.apply(p), p.getMontoPagado(), BigDecimal::add));
        return m.entrySet().stream().sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
    }

    private static String variacion(BigDecimal actual, BigDecimal anterior) {
        if (anterior.compareTo(BigDecimal.ZERO) == 0) {
            return "semana anterior: " + soles(anterior);
        }
        BigDecimal pct = actual.subtract(anterior).multiply(BigDecimal.valueOf(100))
                .divide(anterior, 0, RoundingMode.HALF_UP);
        return (pct.signum() >= 0 ? "+" : "") + pct + "% vs semana anterior (" + soles(anterior) + ")";
    }

    private static long diasParaCumple(LocalDate nac, LocalDate hoy) {
        LocalDate c = (nac.getMonthValue() == 2 && nac.getDayOfMonth() == 29 && !hoy.isLeapYear())
                ? LocalDate.of(hoy.getYear(), 2, 28) : nac.withYear(hoy.getYear());
        if (c.isBefore(hoy)) c = c.plusYears(1);
        return java.time.temporal.ChronoUnit.DAYS.between(hoy, c);
    }

    static String soles(BigDecimal v) {
        return "S/ " + (v == null ? BigDecimal.ZERO : v).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String nombreMetodo(String m) {
        if (m == null) return "—";
        return m.charAt(0) + m.substring(1).toLowerCase(ES);
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    private static void tarjeta(PdfPTable t, String etiqueta, String valor, String detalle) {
        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(FONDO);
        c.setBorderColor(Color.WHITE);
        c.setBorderWidth(3);
        c.setPadding(8);
        c.addElement(new Paragraph(etiqueta.toUpperCase(ES), new Font(Font.HELVETICA, 7, Font.BOLD, GRIS)));
        c.addElement(new Paragraph(valor, new Font(Font.HELVETICA, 15, Font.BOLD, NEGRO)));
        Color color = detalle.startsWith("+") ? VERDE : detalle.startsWith("-") ? ROJO : GRIS;
        c.addElement(new Paragraph(detalle, new Font(Font.HELVETICA, 7, Font.NORMAL, color)));
        t.addCell(c);
    }

    private static PdfPTable tablaClaveValor(String titulo, Map<String, BigDecimal> datos, Font h2, Font normal) {
        PdfPTable t = new PdfPTable(new float[]{3, 2});
        t.setWidthPercentage(100);
        PdfPCell cab = new PdfPCell(new Phrase(titulo, h2));
        cab.setColspan(2);
        cab.setBorder(0);
        cab.setPaddingBottom(6);
        t.addCell(cab);
        if (datos.isEmpty()) {
            PdfPCell v = new PdfPCell(new Phrase("Sin ingresos.", normal));
            v.setColspan(2);
            v.setBorder(0);
            t.addCell(v);
        }
        datos.forEach((k, v) -> fila(t, normal, k, soles(v)));
        return t;
    }

    private static PdfPCell sinBorde(PdfPTable interna) {
        PdfPCell c = new PdfPCell(interna);
        c.setBorder(0);
        c.setPaddingRight(10);
        return c;
    }

    private static PdfPTable tabla(float[] anchos, Font normal, String... cabeceras) {
        PdfPTable t = new PdfPTable(anchos);
        t.setWidthPercentage(100);
        t.setSpacingBefore(6);
        t.setSpacingAfter(14);
        t.setHeaderRows(1);
        Font f = new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE);
        for (String h : cabeceras) {
            PdfPCell c = new PdfPCell(new Phrase(h, f));
            c.setBackgroundColor(NEGRO);
            c.setPadding(5);
            c.setBorderColor(NEGRO);
            t.addCell(c);
        }
        return t;
    }

    private static void fila(PdfPTable t, Font f, String... valores) {
        for (int i = 0; i < valores.length; i++) {
            PdfPCell c = new PdfPCell(new Phrase(valores[i], f));
            c.setPadding(5);
            c.setBorderColor(new Color(225, 225, 230));
            if (i == valores.length - 1) c.setHorizontalAlignment(Element.ALIGN_RIGHT);
            t.addCell(c);
        }
    }
}
