package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.CitaDto;
import com.deroncuts.barberia.dto.DashboardResumen;
import com.deroncuts.barberia.dto.EventoCita;
import com.deroncuts.barberia.dto.MetodoPagoResumen;
import com.deroncuts.barberia.dto.PagosResumen;
import com.deroncuts.barberia.dto.request.CambiarEstadoRequest;
import com.deroncuts.barberia.dto.request.CrearCitaRequest;
import com.deroncuts.barberia.dto.request.RegistrarPagoRequest;
import com.deroncuts.barberia.dto.request.ReprogramarRequest;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.exception.ConflictException;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.EstadoCita;
import com.deroncuts.barberia.model.MetodoPago;
import com.deroncuts.barberia.model.Servicio;
import com.deroncuts.barberia.repository.CitaRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CitaService {

    private static final List<EstadoCita> ESTADOS_QUE_BLOQUEAN =
            List.of(EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA);

    private final CitaRepository citaRepository;
    private final ServicioService servicioService;
    private final DisponibilidadService disponibilidadService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RecordatorioService recordatorioService;

    public CitaService(CitaRepository citaRepository,
                       ServicioService servicioService,
                       DisponibilidadService disponibilidadService,
                       SimpMessagingTemplate messagingTemplate,
                       RecordatorioService recordatorioService) {
        this.citaRepository = citaRepository;
        this.servicioService = servicioService;
        this.disponibilidadService = disponibilidadService;
        this.messagingTemplate = messagingTemplate;
        this.recordatorioService = recordatorioService;
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

        Cita guardada = citaRepository.save(cita);
        publicarEvento("CREADA", guardada);
        recordatorioService.notificarNuevaCita(guardada);
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

    @Transactional
    public CitaDto registrarPago(Long id, RegistrarPagoRequest request) {
        Cita cita = obtenerEntity(id);
        if (cita.getEstado() == EstadoCita.CANCELADA) {
            throw new BusinessException("No se puede cobrar una cita cancelada");
        }
        MetodoPago metodo = parseMetodoPago(request.getMetodoPago());
        BigDecimal monto = request.getMonto();
        if (monto == null) {
            monto = cita.getServicio().getPrecio();
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

    @Transactional(readOnly = true)
    public PagosResumen resumenPagos() {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDate hoy = ahora.toLocalDate();
        LocalDateTime inicioHoy = hoy.atStartOfDay();
        LocalDateTime inicioSemana = hoy.minusDays(hoy.getDayOfWeek().getValue() - 1L).atStartOfDay();
        LocalDateTime inicioMes = hoy.withDayOfMonth(1).atStartOfDay();
        LocalDateTime inicioTotal = LocalDateTime.of(2000, 1, 1, 0, 0);

        PagosResumen resumen = new PagosResumen();
        resumen.setTotal(sumPagos(inicioTotal, ahora));
        resumen.setTotalHoy(sumPagos(inicioHoy, ahora));
        resumen.setTotalSemana(sumPagos(inicioSemana, ahora));
        resumen.setTotalMes(sumPagos(inicioMes, ahora));
        resumen.setCantidad(citaRepository.countByPagadaTrue());
        resumen.setDesglose(desglosePorMetodo());
        return resumen;
    }

    @Transactional(readOnly = true)
    public List<CitaDto> listarPagos(LocalDate desde, LocalDate hasta, String metodo) {
        LocalDateTime inicio = desde != null ? desde.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime fin = hasta != null ? hasta.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);
        List<Cita> pagadas = citaRepository.findByPagadaTrueAndFechaPagoBetweenOrderByFechaPagoDesc(inicio, fin);
        MetodoPago filtro = (metodo == null || metodo.isBlank()) ? null : parseMetodoPago(metodo);
        return pagadas.stream()
                .filter(c -> filtro == null || c.getMetodoPago() == filtro)
                .map(CitaDto::from)
                .toList();
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
        cita.setEstado(nuevoEstado);
        Cita guardada = citaRepository.save(cita);
        if (nuevoEstado == EstadoCita.CANCELADA) {
            recordatorioService.notificarCancelada(guardada);
        }
        publicarEvento("ESTADO", guardada);
        return CitaDto.from(guardada);
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
        Cita guardada = citaRepository.save(cita);
        recordatorioService.notificarReprogramada(guardada);
        publicarEvento("REPROGRAMADA", guardada);
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

    public MetodoPago parseMetodoPago(String metodo) {
        try {
            return MetodoPago.valueOf(metodo.trim().toUpperCase());
        } catch (Exception e) {
            throw new BusinessException(
                    "Método de pago no válido: use EFECTIVO, YAPE, PLIN, TARJETA o TRANSFERENCIA");
        }
    }

    private BigDecimal sumPagos(LocalDateTime inicio, LocalDateTime fin) {
        return citaRepository.sumMontoPagadoEntre(inicio, fin);
    }

    private List<MetodoPagoResumen> desglosePorMetodo() {
        Map<MetodoPago, BigDecimal> totalPorMetodo = new HashMap<>();
        Map<MetodoPago, Long> cantidadPorMetodo = new HashMap<>();

        for (Cita cita : citaRepository.findByPagadaTrue()) {
            MetodoPago metodo = cita.getMetodoPago();
            if (metodo == null) {
                continue;
            }
            totalPorMetodo.merge(metodo, cita.getMontoPagado(), BigDecimal::add);
            cantidadPorMetodo.merge(metodo, 1L, Long::sum);
        }

        List<MetodoPagoResumen> desglose = new ArrayList<>();
        for (MetodoPago metodo : MetodoPago.values()) {
            Long cantidad = cantidadPorMetodo.get(metodo);
            if (cantidad == null) {
                continue;
            }
            MetodoPagoResumen item = new MetodoPagoResumen();
            item.setMetodoPago(metodo.name());
            item.setCantidad(cantidad);
            item.setTotal(totalPorMetodo.get(metodo));
            desglose.add(item);
        }
        return desglose;
    }

    private void validarBloqueDisponible(LocalDateTime inicio, LocalDateTime fin, Long excluirCitaId) {
        LocalDate fecha = inicio.toLocalDate();

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