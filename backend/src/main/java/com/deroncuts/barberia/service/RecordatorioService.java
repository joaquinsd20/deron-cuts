package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.RecordatorioDto;
import com.deroncuts.barberia.dto.request.CrearRecordatorioRequest;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.CanalRecordatorio;
import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.ConfiguracionNegocio;
import com.deroncuts.barberia.model.EstadoRecordatorio;
import com.deroncuts.barberia.model.Recordatorio;
import com.deroncuts.barberia.model.TipoRecordatorio;
import com.deroncuts.barberia.repository.RecordatorioRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class RecordatorioService {

    private static final DateTimeFormatter FECHA_HORA =
            DateTimeFormatter.ofPattern("EEEE d 'de' MMMM, HH:mm", new Locale("es", "PE"));

    private final RecordatorioRepository recordatorioRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConfiguracionService configuracionService;

    public RecordatorioService(RecordatorioRepository recordatorioRepository,
                               SimpMessagingTemplate messagingTemplate,
                               ConfiguracionService configuracionService) {
        this.recordatorioRepository = recordatorioRepository;
        this.messagingTemplate = messagingTemplate;
        this.configuracionService = configuracionService;
    }

    public void notificarNuevaCita(Cita cita) {
        ConfiguracionNegocio config = configuracionService.obtenerOMeterDefault();
        if (!Boolean.TRUE.equals(config.getRecordatoriosActivo())) {
            return;
        }
        emitirInterno(cita, TipoRecordatorio.NUEVA_CITA,
                "Nueva cita · " + cita.getNombreCliente() + " · " + cita.getServicio().getNombre());
        if (Boolean.TRUE.equals(config.getWhatsappActivo())) {
            programarAntesCita(cita, config);
        }
    }

    public void notificarReprogramada(Cita cita) {
        ConfiguracionNegocio config = configuracionService.obtenerOMeterDefault();
        if (!Boolean.TRUE.equals(config.getRecordatoriosActivo())) {
            return;
        }
        cancelarPendientesAntesCita(cita.getId());
        emitirInterno(cita, TipoRecordatorio.REPROGRAMADA,
                "Cita reprogramada · " + cita.getNombreCliente() + " · nueva fecha "
                        + cita.getFechaHoraInicio().format(FECHA_HORA));
        if (Boolean.TRUE.equals(config.getWhatsappActivo())) {
            programarAntesCita(cita, config);
        }
    }

    public void notificarCancelada(Cita cita) {
        ConfiguracionNegocio config = configuracionService.obtenerOMeterDefault();
        if (!Boolean.TRUE.equals(config.getRecordatoriosActivo())) {
            return;
        }
        cancelarPendientesAntesCita(cita.getId());
        emitirInterno(cita, TipoRecordatorio.CANCELADA,
                "Cita cancelada · " + cita.getNombreCliente() + " · era "
                        + cita.getFechaHoraInicio().format(FECHA_HORA));
    }

    @Transactional
    public RecordatorioDto crearManual(CrearRecordatorioRequest request) {
        Recordatorio r = new Recordatorio();
        r.setTipo(TipoRecordatorio.MANUAL);
        r.setCanal(request.getCanal());
        r.setMensaje(request.getMensaje().trim());
        r.setDestinatarioNombre(trimToNull(request.getDestinatarioNombre()));
        r.setDestinatarioTelefono(trimToNull(request.getDestinatarioTelefono()));
        r.setProgramadoPara(request.getProgramadoPara() == null
                ? LocalDateTime.now()
                : request.getProgramadoPara());
        Recordatorio guardado = recordatorioRepository.save(r);
        if (guardado.getCanal() == CanalRecordatorio.INTERNO
                && !guardado.getProgramadoPara().isAfter(LocalDateTime.now())) {
            entregarAhora(guardado);
        }
        return RecordatorioDto.from(guardado);
    }

    @Transactional(readOnly = true)
    public List<RecordatorioDto> listar(EstadoRecordatorio estado) {
        List<Recordatorio> lista = (estado == null)
                ? recordatorioRepository.findByEstadoInOrderByProgramadoParaDesc(
                        List.of(EstadoRecordatorio.PENDIENTE, EstadoRecordatorio.ENVIADO))
                : recordatorioRepository.findByEstadoOrderByProgramadoParaDesc(estado);
        return lista.stream().map(RecordatorioDto::from).toList();
    }

    @Transactional(readOnly = true)
    public long contarPendientes() {
        return recordatorioRepository.countByEstado(EstadoRecordatorio.PENDIENTE);
    }

    @Transactional
    public RecordatorioDto enviarAhora(Long id) {
        Recordatorio r = obtener(id);
        if (r.getCanal() != CanalRecordatorio.INTERNO) {
            throw new BusinessException(
                    "Los recordatorios por WhatsApp se envían al conectar la integración");
        }
        if (r.getEstado() == EstadoRecordatorio.CANCELADO) {
            throw new BusinessException("El recordatorio está cancelado");
        }
        entregarAhora(r);
        return RecordatorioDto.from(r);
    }

    @Transactional
    public RecordatorioDto cancelar(Long id) {
        Recordatorio r = obtener(id);
        r.setEstado(EstadoRecordatorio.CANCELADO);
        return RecordatorioDto.from(recordatorioRepository.save(r));
    }

    @Transactional
    public void eliminar(Long id) {
        if (!recordatorioRepository.existsById(id)) {
            throw new NotFoundException("Recordatorio no encontrado");
        }
        recordatorioRepository.deleteById(id);
    }

    @Scheduled(fixedDelayString = "${app.recordatorios.poll-ms:30000}")
    @Transactional
    public void entregarPendientes() {
        List<Recordatorio> pendientes =
                recordatorioRepository.findByEstadoAndProgramadoParaLessThanEqualOrderByProgramadoParaAsc(
                        EstadoRecordatorio.PENDIENTE, LocalDateTime.now());
        for (Recordatorio r : pendientes) {
            if (r.getCanal() == CanalRecordatorio.INTERNO) {
                entregarAhora(r);
            }
        }
    }

    private Recordatorio obtener(Long id) {
        return recordatorioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Recordatorio no encontrado"));
    }

    private void emitirInterno(Cita cita, TipoRecordatorio tipo, String mensaje) {
        Recordatorio r = base(cita, tipo, CanalRecordatorio.INTERNO, LocalDateTime.now());
        r.setMensaje(mensaje);
        entregarAhora(recordatorioRepository.save(r));
    }

    private void programarAntesCita(Cita cita, ConfiguracionNegocio config) {
        int horas = config.getRecordatoriosAntesHoras() == null ? 2 : config.getRecordatoriosAntesHoras();
        LocalDateTime programado = cita.getFechaHoraInicio().minusHours(horas);
        if (!programado.isAfter(LocalDateTime.now())) {
            return;
        }
        Recordatorio r = base(cita, TipoRecordatorio.ANTES_CITA, CanalRecordatorio.WHATSAPP, programado);
        r.setDestinatarioNombre(cita.getNombreCliente());
        r.setDestinatarioTelefono(cita.getTelefonoWhatsapp());
        r.setMensaje("Hola " + cita.getNombreCliente()
                + ", te recordamos tu cita en DERON CUTS: "
                + cita.getFechaHoraInicio().format(FECHA_HORA) + ". Te esperamos.");
        recordatorioRepository.save(r);
    }

    private void cancelarPendientesAntesCita(Long citaId) {
        if (citaId == null) {
            return;
        }
        for (Recordatorio r : recordatorioRepository.findByCitaIdAndEstadoAndTipo(
                citaId, EstadoRecordatorio.PENDIENTE, TipoRecordatorio.ANTES_CITA)) {
            r.setEstado(EstadoRecordatorio.CANCELADO);
            recordatorioRepository.save(r);
        }
    }

    private Recordatorio base(Cita cita, TipoRecordatorio tipo, CanalRecordatorio canal,
                              LocalDateTime programadoPara) {
        Recordatorio r = new Recordatorio();
        r.setCitaId(cita.getId());
        r.setTipo(tipo);
        r.setCanal(canal);
        r.setProgramadoPara(programadoPara);
        r.setServicioNombre(cita.getServicio().getNombre());
        r.setFechaHoraCita(cita.getFechaHoraInicio());
        return r;
    }

    private void entregarAhora(Recordatorio r) {
        r.setEstado(EstadoRecordatorio.ENVIADO);
        r.setEnviadoEn(LocalDateTime.now());
        Recordatorio guardado = recordatorioRepository.save(r);
        messagingTemplate.convertAndSend("/topic/recordatorios", RecordatorioDto.from(guardado));
    }

    private String trimToNull(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}