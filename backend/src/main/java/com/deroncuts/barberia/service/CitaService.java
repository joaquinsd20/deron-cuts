package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.CitaDto;
import com.deroncuts.barberia.dto.DashboardResumen;
import com.deroncuts.barberia.dto.EventoCita;
import com.deroncuts.barberia.dto.MetodoPagoResumen;
import com.deroncuts.barberia.dto.PagosResumen;
import com.deroncuts.barberia.dto.request.AplicarTardanzaRequest;
import com.deroncuts.barberia.dto.request.CambiarEstadoRequest;
import com.deroncuts.barberia.dto.request.ConfirmarAdelantoRequest;
import com.deroncuts.barberia.dto.request.CrearCitaClienteRequest;
import com.deroncuts.barberia.dto.request.CrearCitaRequest;
import com.deroncuts.barberia.dto.request.RegistrarPagoRequest;
import com.deroncuts.barberia.dto.request.ReprogramarRequest;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.exception.ConflictException;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.Cliente;
import com.deroncuts.barberia.model.EstadoCita;
import com.deroncuts.barberia.dto.PagoDto;
import com.deroncuts.barberia.model.Servicio;
import com.deroncuts.barberia.repository.CitaRepository;
import com.deroncuts.barberia.repository.ConfiguracionNegocioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CitaService {

    private static final List<EstadoCita> ESTADOS_QUE_BLOQUEAN =
            List.of(EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA);

    private final CitaRepository citaRepository;
    private final ConfiguracionNegocioRepository configuracionRepository;
    private final com.deroncuts.barberia.repository.RecordatorioRepository recordatorioRepository;
    private final ServicioService servicioService;
    private final ConfiguracionService configuracionService;
    private final NotificacionService notificaciones;
    private final DisponibilidadService disponibilidadService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RecordatorioService recordatorioService;
    private final int adelantoPorcentaje;
    private final BigDecimal penalidadTardanza;

    public CitaService(CitaRepository citaRepository,
                       ConfiguracionNegocioRepository configuracionRepository,
                       com.deroncuts.barberia.repository.RecordatorioRepository recordatorioRepository,
                       ServicioService servicioService,
                       ConfiguracionService configuracionService,
                       NotificacionService notificaciones,
                       DisponibilidadService disponibilidadService,
                       SimpMessagingTemplate messagingTemplate,
                       RecordatorioService recordatorioService,
                       @Value("${app.reservas.adelanto-porcentaje:50}") int adelantoPorcentaje,
                       @Value("${app.reservas.penalidad-tardanza:10}") BigDecimal penalidadTardanza) {
        this.citaRepository = citaRepository;
        this.configuracionRepository = configuracionRepository;
        this.recordatorioRepository = recordatorioRepository;
        this.servicioService = servicioService;
        this.configuracionService = configuracionService;
        this.notificaciones = notificaciones;
        this.disponibilidadService = disponibilidadService;
        this.messagingTemplate = messagingTemplate;
        this.recordatorioService = recordatorioService;
        this.adelantoPorcentaje = adelantoPorcentaje;
        this.penalidadTardanza = penalidadTardanza;
    }

    @Transactional
    public CitaDto crear(CrearCitaRequest request) {
        Servicio servicio = servicioService.obtenerEntity(request.getServicioId());
        if (!servicio.isActivo()) {
            throw new BusinessException("El servicio seleccionado no está disponible");
        }

        LocalDateTime inicio = request.getFechaHoraInicio();
        if (inicio == null || inicio.isBefore(LocalDateTime.now())) {
            throw new BusinessException("La fecha y hora deben estar en el futuro");
        }
        LocalDateTime fin = inicio.plusMinutes(servicio.getDuracionMinutos());
        validarBloqueDisponible(inicio, fin, null);

        Cita cita = new Cita();
        cita.setServicio(servicio);
        cita.setNombreCliente(request.getNombreCliente().trim());
        cita.setTelefonoWhatsapp(request.getTelefonoWhatsapp().trim());
        cita.setEmail(request.getEmail());
        cita.setNotas(request.getNotas());
        cita.setFechaHoraInicio(inicio);
        cita.setFechaHoraFin(fin);
        cita.setEstado(EstadoCita.PENDIENTE);
        cita.setPrecioFinal(servicio.getPrecio());
        cita.setAdelantoMonto(calcularAdelanto(servicio.getPrecio()));
        cita.setPenalidadTardanza(BigDecimal.ZERO);

        Cita guardada = citaRepository.save(cita);
        publicarEvento("CREADA", guardada);
        recordatorioService.notificarNuevaCita(guardada);
        return CitaDto.from(guardada);
    }

    @Transactional
    public CitaDto crearParaCliente(Cliente cliente, CrearCitaClienteRequest request) {
        Servicio servicio = servicioService.obtenerEntity(request.getServicioId());
        if (!servicio.isActivo()) {
            throw new BusinessException("El servicio seleccionado no está disponible");
        }

        LocalDateTime inicio = request.getFechaHoraInicio();
        if (inicio == null || inicio.isBefore(LocalDateTime.now())) {
            throw new BusinessException("La fecha y hora deben estar en el futuro");
        }
        LocalDateTime fin = inicio.plusMinutes(servicio.getDuracionMinutos());
        validarBloqueDisponible(inicio, fin, null);

        boolean cumpleanos = esSemanaDeCumpleanos(cliente.getFechaNacimiento(), inicio.toLocalDate());
        BigDecimal precioFinal = cumpleanos ? BigDecimal.ZERO : servicio.getPrecio();

        Cita cita = new Cita();
        cita.setServicio(servicio);
        cita.setCliente(cliente);
        cita.setNombreCliente(cliente.getNombre());
        cita.setTelefonoWhatsapp(cliente.getTelefono());
        cita.setEmail(cliente.getEmail());
        cita.setNotas(request.getNotas());
        cita.setFechaHoraInicio(inicio);
        cita.setFechaHoraFin(fin);
        cita.setEstado(EstadoCita.PENDIENTE);
        cita.setPrecioFinal(precioFinal);
        cita.setDescuentoCumpleanos(cumpleanos);
        cita.setAdelantoMonto(cumpleanos ? BigDecimal.ZERO : calcularAdelanto(precioFinal));
        cita.setAdelantoPagado(false);
        cita.setAdelantoAplicado(false);
        cita.setPenalidadTardanza(BigDecimal.ZERO);

        Cita guardada = citaRepository.save(cita);
        publicarEvento("CREADA", guardada);
        recordatorioService.notificarNuevaCita(guardada);
        notificaciones.avisarAdmins("📅 Nueva reserva",
                guardada.getNombreCliente() + " · " + servicio.getNombre() + " · "
                        + fechaTexto(guardada.getFechaHoraInicio())
                        + (cumpleanos ? " · 🎂 semana de cumpleaños" : ""),
                "/citas");
        return CitaDto.from(guardada);
    }

    @Transactional(readOnly = true)
    public List<CitaDto> listar(LocalDate fecha, EstadoCita estado) {
        List<Cita> citas;
        if (fecha != null) {
            LocalDateTime desde = fecha.atStartOfDay();
            LocalDateTime hasta = fecha.plusDays(1).atStartOfDay();
            citas = (estado != null)
                    ? citaRepository.findByFechaHoraInicioBetweenAndEstadoOrderByFechaHoraInicioAsc(desde, hasta, estado)
                    : citaRepository.findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(desde, hasta);
        } else if (estado != null) {
            citas = citaRepository.findByEstadoOrderByFechaHoraInicioAsc(estado);
        } else {
            citas = citaRepository.findByFechaHoraInicioAfterOrderByFechaHoraInicioAsc(LocalDateTime.now().minusDays(1));
        }
        return citas.stream().map(CitaDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CitaDto> listarEntre(LocalDate desde, LocalDate hasta, EstadoCita estado) {
        LocalDateTime ini = desde != null ? desde.atStartOfDay() : LocalDateTime.now().minusDays(1);
        LocalDateTime fin = hasta != null ? hasta.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(60);
        List<Cita> citas = (estado != null)
                ? citaRepository.findByFechaHoraInicioBetweenAndEstadoOrderByFechaHoraInicioAsc(ini, fin, estado)
                : citaRepository.findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(ini, fin);
        return citas.stream().map(CitaDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CitaDto> listarPorCliente(Long clienteId) {
        return citaRepository.findByClienteIdOrderByFechaHoraInicioDesc(clienteId)
                .stream()
                .map(CitaDto::from)
                .toList();
    }

    @Transactional
    public CitaDto registrarPago(Long id, RegistrarPagoRequest request) {
        Cita cita = obtenerEntity(id);
        if (cita.getEstado() == EstadoCita.CANCELADA) {
            throw new BusinessException("No se puede cobrar una cita cancelada");
        }
        String metodo = parseMetodoPago(request.getMetodoPago());
        BigDecimal monto = request.getMonto();
        if (monto == null) {
            monto = saldoPendiente(cita);
        }
        if (monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto debe ser mayor a cero");
        }
        cita.setMetodoPago(metodo);
        cita.setMontoPagado(monto);
        cita.setFechaPago(LocalDateTime.now());
        cita.setPagada(true);
        Cita guardada = citaRepository.save(cita);
        publicarEvento("PAGO", guardada);
        return CitaDto.from(guardada);
    }

    @Transactional
    public CitaDto confirmarAdelanto(Long id, ConfirmarAdelantoRequest request) {
        Cita cita = obtenerEntity(id);
        BigDecimal adelanto = cita.getAdelantoMonto() == null ? BigDecimal.ZERO : cita.getAdelantoMonto();
        if (adelanto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Esta cita no requiere adelanto");
        }

        if (Boolean.TRUE.equals(request.getPagado())) {
            String metodo = request.getMetodoPago() == null || request.getMetodoPago().isBlank()
                    ? configuracionService.metodosPago().get(0)
                    : parseMetodoPago(request.getMetodoPago());
            cita.setAdelantoPagado(true);
            cita.setAdelantoAplicado(!cita.isTardanzaAplicada());
            cita.setMetodoAdelanto(metodo);
            cita.setFechaAdelanto(LocalDateTime.now());
            if (cita.getEstado() == EstadoCita.PENDIENTE) {
                cita.setEstado(EstadoCita.CONFIRMADA);
            }
        } else {
            cita.setAdelantoPagado(false);
            cita.setAdelantoAplicado(false);
            cita.setMetodoAdelanto(null);
            cita.setFechaAdelanto(null);
        }

        Cita guardada = citaRepository.save(cita);
        publicarEvento("ADELANTO", guardada);
        if (Boolean.TRUE.equals(request.getPagado())) {
            avisarClienteDe(guardada, "✅ Tu cita está confirmada",
                    "Recibimos tu adelanto. Te esperamos el " + fechaTexto(guardada.getFechaHoraInicio()) + ".");
        }
        return CitaDto.from(guardada);
    }

    @Transactional
    public CitaDto aplicarTardanza(Long id, AplicarTardanzaRequest request) {
        Cita cita = obtenerEntity(id);
        boolean aplicar = Boolean.TRUE.equals(request.getAplicar());
        cita.setTardanzaAplicada(aplicar);
        cita.setPenalidadTardanza(aplicar ? penalidadTardanza : BigDecimal.ZERO);
        if (cita.isAdelantoPagado()) {
            cita.setAdelantoAplicado(!aplicar);
        }
        Cita guardada = citaRepository.save(cita);
        publicarEvento("TARDANZA", guardada);
        return CitaDto.from(guardada);
    }

    @Transactional(readOnly = true)
    public PagosResumen resumenPagos() {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDate hoy = ahora.toLocalDate();
        LocalDateTime inicioHoy = hoy.atStartOfDay();
        LocalDateTime inicioSemana = hoy.minusDays(hoy.getDayOfWeek().getValue() - 1L).atStartOfDay();
        LocalDateTime inicioMes = hoy.withDayOfMonth(1).atStartOfDay();
        LocalDateTime inicioTotal = LocalDateTime.of(2000, 1, 1, 0, 0);

        List<PagoDto> todos = movimientos(inicioTotal, ahora.plusMinutes(1));
        PagosResumen resumen = new PagosResumen();
        resumen.setTotal(sumar(todos, inicioTotal));
        resumen.setTotalHoy(sumar(todos, inicioHoy));
        resumen.setTotalSemana(sumar(todos, inicioSemana));
        resumen.setTotalMes(sumar(todos, inicioMes));
        resumen.setCantidad(todos.size());
        resumen.setDesglose(desglosePorMetodo(todos));
        return resumen;
    }

    @Transactional(readOnly = true)
    public List<PagoDto> listarPagos(LocalDate desde, LocalDate hasta, String metodo) {
        LocalDateTime inicio = desde != null ? desde.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime fin = hasta != null ? hasta.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);
        String filtro = (metodo == null || metodo.isBlank()) ? null : metodo.trim().toUpperCase(java.util.Locale.ROOT);
        return movimientos(inicio, fin).stream()
                .filter(p -> filtro == null || filtro.equals(p.getMetodoPago()))
                .toList();
    }

    /**
     * Todo el dinero recibido entre dos fechas: cada adelanto (en la fecha en que se
     * confirmó) y cada cobro de saldo (en la fecha del cobro). Antes solo se contaba el
     * saldo, así que los adelantos no aparecían en las ganancias.
     */
    private List<PagoDto> movimientos(LocalDateTime inicio, LocalDateTime fin) {
        List<PagoDto> lista = new ArrayList<>();
        for (Cita c : citaRepository.findByAdelantoPagadoTrueAndFechaAdelantoBetween(inicio, fin)) {
            if (c.getAdelantoMonto() != null && c.getAdelantoMonto().compareTo(BigDecimal.ZERO) > 0) {
                lista.add(PagoDto.de("ADELANTO", c.getId(), c.getFechaAdelanto(), c.getMetodoAdelanto(),
                        c.getAdelantoMonto(), c.getNombreCliente(), c.getServicio().getNombre()));
            }
        }
        for (Cita c : citaRepository.findByPagadaTrueAndFechaPagoBetweenOrderByFechaPagoDesc(inicio, fin)) {
            if (c.getMontoPagado() != null && c.getMontoPagado().compareTo(BigDecimal.ZERO) > 0) {
                lista.add(PagoDto.de("SALDO", c.getId(), c.getFechaPago(), c.getMetodoPago(),
                        c.getMontoPagado(), c.getNombreCliente(), c.getServicio().getNombre()));
            }
        }
        lista.sort((a, b) -> b.getFechaPago().compareTo(a.getFechaPago()));
        return lista;
    }

    private static BigDecimal sumar(List<PagoDto> pagos, LocalDateTime desde) {
        return pagos.stream()
                .filter(p -> !p.getFechaPago().isBefore(desde))
                .map(PagoDto::getMontoPagado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public CitaDto obtener(Long id) {
        return CitaDto.from(obtenerEntity(id));
    }

    @Transactional
    public CitaDto cambiarEstado(Long id, CambiarEstadoRequest request) {
        Cita cita = obtenerEntity(id);
        EstadoCita nuevoEstado = parsearEstado(request.getEstado());
        if (cita.getEstado() == EstadoCita.COMPLETADA) {
            throw new BusinessException("Una cita completada no puede cambiar de estado");
        }
        EstadoCita anterior = cita.getEstado();
        cita.setEstado(nuevoEstado);
        Cita guardada = citaRepository.save(cita);
        if (nuevoEstado == EstadoCita.CANCELADA) {
            recordatorioService.notificarCancelada(guardada);
        }
        publicarEvento("ESTADO", guardada);
        if (anterior != nuevoEstado) {
            if (nuevoEstado == EstadoCita.CANCELADA) {
                avisarClienteDe(guardada, "Tu cita fue cancelada",
                        "La cita del " + fechaTexto(guardada.getFechaHoraInicio())
                                + " fue cancelada. Escríbenos por WhatsApp para reprogramarla.");
            } else if (nuevoEstado == EstadoCita.CONFIRMADA) {
                avisarClienteDe(guardada, "✅ Tu cita está confirmada",
                        "Te esperamos el " + fechaTexto(guardada.getFechaHoraInicio()) + ".");
            }
        }
        return CitaDto.from(guardada);
    }

    /**
     * Borra una cita (por ejemplo, una de prueba o duplicada). No se permite si ya tiene
     * dinero registrado (pago o adelanto), para no descuadrar el historial de Pagos:
     * en ese caso hay que cancelarla.
     */
    @Transactional
    public void eliminar(Long id) {
        Cita cita = obtenerEntity(id);
        if (cita.isPagada() || cita.isAdelantoPagado()) {
            throw new BusinessException(
                    "Esta cita tiene un pago o adelanto registrado; cancélala en lugar de eliminarla");
        }
        CitaDto dto = CitaDto.from(cita);
        recordatorioRepository.deleteByCitaId(id);
        citaRepository.delete(cita);
        messagingTemplate.convertAndSend("/topic/citas", new EventoCita("ELIMINADA", dto));
    }

    @Transactional
    public CitaDto cancelarPorCliente(Cliente cliente, Long citaId) {
        Cita cita = obtenerEntity(citaId);
        if (cita.getCliente() == null || !cita.getCliente().getId().equals(cliente.getId())) {
            // Mismo mensaje que si no existiera: no revelar citas de otros clientes.
            throw new NotFoundException("Cita no encontrada");
        }
        if (cita.getEstado() != EstadoCita.PENDIENTE && cita.getEstado() != EstadoCita.CONFIRMADA) {
            throw new BusinessException("Esta cita ya no se puede cancelar");
        }
        if (!cita.getFechaHoraInicio().isAfter(LocalDateTime.now())) {
            throw new BusinessException("No puedes cancelar una cita que ya empezó");
        }
        cita.setEstado(EstadoCita.CANCELADA);
        Cita guardada = citaRepository.save(cita);
        recordatorioService.notificarCancelada(guardada);
        publicarEvento("ESTADO", guardada);
        notificaciones.avisarAdmins("❌ Cita cancelada",
                guardada.getNombreCliente() + " canceló su cita del " + fechaTexto(guardada.getFechaHoraInicio())
                        + (guardada.isAdelantoPagado() ? " (tenía adelanto pagado)" : ""),
                "/citas");
        return CitaDto.from(guardada);
    }

    // ---------- Avisos push ----------

    private static final java.time.format.DateTimeFormatter FMT_AVISO =
            java.time.format.DateTimeFormatter.ofPattern("EEEE d 'de' MMMM, HH:mm", new java.util.Locale("es", "PE"));

    static String fechaTexto(LocalDateTime fecha) {
        return fecha.format(FMT_AVISO);
    }

    private void avisarClienteDe(Cita cita, String titulo, String cuerpo) {
        if (cita.getCliente() != null) {
            notificaciones.avisarCliente(cita.getCliente().getId(), titulo, cuerpo, "/cuenta");
        }
    }

    @Transactional
    public CitaDto reprogramar(Long id, ReprogramarRequest request) {
        Cita cita = obtenerEntity(id);
        if (cita.getEstado() == EstadoCita.COMPLETADA || cita.getEstado() == EstadoCita.CANCELADA) {
            throw new BusinessException("Una cita completada o cancelada no puede reprogramarse");
        }
        LocalDateTime inicio = request.getFechaHoraInicio();
        if (inicio == null || inicio.isBefore(LocalDateTime.now())) {
            throw new BusinessException("La nueva fecha y hora deben estar en el futuro");
        }
        LocalDateTime fin = inicio.plusMinutes(cita.getServicio().getDuracionMinutos());
        validarBloqueDisponible(inicio, fin, id);

        cita.setFechaHoraInicio(inicio);
        cita.setFechaHoraFin(fin);
        cita.setAvisoPrevioEnviado(false);
        Cita guardada = citaRepository.save(cita);
        recordatorioService.notificarReprogramada(guardada);
        publicarEvento("REPROGRAMADA", guardada);
        avisarClienteDe(guardada, "📅 Tu cita cambió de horario",
                "Nueva fecha: " + fechaTexto(guardada.getFechaHoraInicio()) + ". Te esperamos.");
        return CitaDto.from(guardada);
    }

    @Transactional(readOnly = true)
    public DashboardResumen resumen() {
        LocalDateTime hoyInicio = LocalDate.now().atStartOfDay();
        LocalDateTime hoyFin = LocalDate.now().plusDays(1).atStartOfDay();

        DashboardResumen resumen = new DashboardResumen();
        resumen.setCitasHoy(citaRepository.countByFechaHoraInicioBetween(hoyInicio, hoyFin));
        resumen.setPendientes(citaRepository.countByEstado(EstadoCita.PENDIENTE));
        resumen.setConfirmadas(citaRepository.countByEstado(EstadoCita.CONFIRMADA));
        resumen.setCompletadas(citaRepository.countByEstado(EstadoCita.COMPLETADA));
        resumen.setCanceladas(citaRepository.countByEstado(EstadoCita.CANCELADA));
        resumen.setGananciasHoy(sumPagos(hoyInicio, LocalDateTime.now()));
        citaRepository.findByFechaHoraInicioBetweenAndEstadoInOrderByFechaHoraInicioAsc(
                        LocalDateTime.now(), LocalDateTime.now().plusDays(30), ESTADOS_QUE_BLOQUEAN)
                .stream()
                .findFirst()
                .ifPresent(cita -> resumen.setProximaCita(CitaDto.from(cita)));
        return resumen;
    }

    @Transactional(readOnly = true)
    public Cita obtenerEntity(Long id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Cita no encontrada"));
    }

    public EstadoCita parsearEstado(String estado) {
        try {
            return EstadoCita.valueOf(estado.trim().toUpperCase());
        } catch (Exception e) {
            throw new BusinessException("Estado no válido: use PENDIENTE, CONFIRMADA, COMPLETADA o CANCELADA");
        }
    }

    /** Acepta solo los métodos que el barbero configuró (EFECTIVO, YAPE, PLIN, …). */
    public String parseMetodoPago(String metodo) {
        List<String> permitidos = configuracionService.metodosPago();
        String valor = metodo == null ? "" : metodo.trim().replaceAll("\s+", " ").toUpperCase(java.util.Locale.ROOT);
        if (!permitidos.contains(valor)) {
            throw new BusinessException("Método de pago no válido. Usa: " + String.join(", ", permitidos));
        }
        return valor;
    }

    private BigDecimal sumPagos(LocalDateTime inicio, LocalDateTime fin) {
        return sumar(movimientos(inicio, fin), inicio);
    }

    private List<MetodoPagoResumen> desglosePorMetodo(List<PagoDto> pagos) {
        Map<String, BigDecimal> totalPorMetodo = new java.util.LinkedHashMap<>();
        Map<String, Long> cantidadPorMetodo = new HashMap<>();
        for (PagoDto p : pagos) {
            String metodo = p.getMetodoPago() == null ? "SIN MÉTODO" : p.getMetodoPago();
            totalPorMetodo.merge(metodo, p.getMontoPagado(), BigDecimal::add);
            cantidadPorMetodo.merge(metodo, 1L, Long::sum);
        }
        List<MetodoPagoResumen> desglose = new ArrayList<>();
        totalPorMetodo.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .forEach(e -> {
                    MetodoPagoResumen item = new MetodoPagoResumen();
                    item.setMetodoPago(e.getKey());
                    item.setCantidad(cantidadPorMetodo.get(e.getKey()));
                    item.setTotal(e.getValue());
                    desglose.add(item);
                });
        return desglose;
    }

    private BigDecimal calcularAdelanto(BigDecimal precio) {
        if (precio == null || precio.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return precio.multiply(BigDecimal.valueOf(adelantoPorcentaje))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal precioFinal(Cita cita) {
        return cita.getPrecioFinal() != null ? cita.getPrecioFinal() : cita.getServicio().getPrecio();
    }

    private BigDecimal saldoPendiente(Cita cita) {
        BigDecimal penalidad = cita.getPenalidadTardanza() == null
                ? BigDecimal.ZERO
                : cita.getPenalidadTardanza();
        BigDecimal adelanto = cita.getAdelantoMonto() == null
                ? BigDecimal.ZERO
                : cita.getAdelantoMonto();
        BigDecimal credito = cita.isAdelantoPagado() && cita.isAdelantoAplicado()
                ? adelanto
                : BigDecimal.ZERO;
        BigDecimal pagado = cita.getMontoPagado() == null
                ? BigDecimal.ZERO
                : cita.getMontoPagado();
        return precioFinal(cita).add(penalidad).subtract(credito).subtract(pagado).max(BigDecimal.ZERO);
    }

    private boolean esSemanaDeCumpleanos(LocalDate nacimiento, LocalDate fechaCita) {
        if (nacimiento == null || fechaCita == null) {
            return false;
        }
        for (int anio = fechaCita.getYear() - 1; anio <= fechaCita.getYear(); anio++) {
            LocalDate cumpleanos;
            if (nacimiento.getMonth() == Month.FEBRUARY && nacimiento.getDayOfMonth() == 29) {
                cumpleanos = LocalDate.of(anio, 2, 28);
            } else {
                cumpleanos = nacimiento.withYear(anio);
            }
            LocalDate lunes = cumpleanos.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            LocalDate domingo = cumpleanos.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            if (!fechaCita.isBefore(lunes) && !fechaCita.isAfter(domingo)) {
                return true;
            }
        }
        return false;
    }

    private void validarBloqueDisponible(LocalDateTime inicio, LocalDateTime fin, Long excluirCitaId) {
        LocalDate fecha = inicio.toLocalDate();

        // Candado (SELECT ... FOR UPDATE) hasta el fin de la transacción: dos reservas
        // simultáneas para el mismo horario se procesan una tras otra, y la segunda
        // ve la primera y recibe "Ese horario ya está reservado".
        configuracionRepository.findFirstByOrderByIdAsc();

        if (!disponibilidadService.estaDentroDeHorarioDeAtencion(inicio, fin)) {
            throw new ConflictException("El horario elegido está fuera del horario de atención de " + fecha);
        }

        boolean localSolapado = (excluirCitaId == null)
                ? citaRepository.existsByFechaHoraInicioLessThanAndFechaHoraFinGreaterThanAndEstadoIn(
                        fin, inicio, ESTADOS_QUE_BLOQUEAN)
                : citaRepository.existsByFechaHoraInicioLessThanAndFechaHoraFinGreaterThanAndEstadoInAndIdNot(
                        fin, inicio, ESTADOS_QUE_BLOQUEAN, excluirCitaId);
        if (localSolapado) {
            throw new ConflictException("Ese horario ya está reservado. Elige otro.");
        }
    }

    private void publicarEvento(String accion, Cita cita) {
        messagingTemplate.convertAndSend("/topic/citas", new EventoCita(accion, CitaDto.from(cita)));
    }
}