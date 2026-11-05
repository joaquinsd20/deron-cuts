package com.deroncuts.barberia.service;

import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.EstadoCita;
import com.deroncuts.barberia.repository.CitaRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cada minuto revisa las citas que empiezan pronto (por defecto en 2 horas, configurable
 * en "Recordatorios") y avisa por push al cliente y al barbero, una sola vez por cita.
 */
@Component
public class AvisosProgramados {

    private final CitaRepository citaRepository;
    private final ConfiguracionService configuracionService;
    private final NotificacionService notificaciones;

    public AvisosProgramados(CitaRepository citaRepository,
                             ConfiguracionService configuracionService,
                             NotificacionService notificaciones) {
        this.citaRepository = citaRepository;
        this.configuracionService = configuracionService;
        this.notificaciones = notificaciones;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
    @Transactional
    public void avisarCitasProximas() {
        var config = configuracionService.obtenerOMeterDefault();
        if (Boolean.FALSE.equals(config.getRecordatoriosActivo())) {
            return;
        }
        int horas = config.getRecordatoriosAntesHoras() == null ? 2 : config.getRecordatoriosAntesHoras();
        LocalDateTime ahora = LocalDateTime.now();
        List<Cita> proximas = citaRepository.findByEstadoInAndAvisoPrevioEnviadoFalseAndFechaHoraInicioBetween(
                List.of(EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA), ahora, ahora.plusHours(horas));
        for (Cita c : proximas) {
            String hora = c.getFechaHoraInicio().toLocalTime().toString().substring(0, 5);
            boolean esHoy = c.getFechaHoraInicio().toLocalDate().equals(ahora.toLocalDate());
            String cuando = (esHoy ? "hoy a las " : "mañana a las ") + hora;
            if (c.getCliente() != null) {
                notificaciones.avisarCliente(c.getCliente().getId(), "⏰ Tu cita es pronto",
                        c.getServicio().getNombre() + " " + cuando + " en DERON CUTS. Recuerda: 15 min de tolerancia.",
                        "/cuenta");
            }
            notificaciones.avisarAdmins("⏰ Próxima cita",
                    c.getNombreCliente() + " · " + c.getServicio().getNombre() + " · " + cuando
                            + (c.getEstado() == EstadoCita.PENDIENTE ? " · adelanto pendiente" : ""),
                    "/");
            c.setAvisoPrevioEnviado(true);
            citaRepository.save(c);
        }
    }
}
