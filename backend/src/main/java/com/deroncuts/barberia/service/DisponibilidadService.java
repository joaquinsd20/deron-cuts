package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.ConfiguracionDto;
import com.deroncuts.barberia.dto.DisponibilidadResponse;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.Cita;
import com.deroncuts.barberia.model.EstadoCita;
import com.deroncuts.barberia.model.Servicio;
import com.deroncuts.barberia.repository.CitaRepository;
import com.deroncuts.barberia.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DisponibilidadService {

    private static final int PASO_MINUTOS = 30;
    private static final List<EstadoCita> ESTADOS_QUE_BLOQUEAN =
            List.of(EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA);

    private static final Map<DayOfWeek, String> DIA_CLAVE = Map.of(
            DayOfWeek.MONDAY, "LUNES",
            DayOfWeek.TUESDAY, "MARTES",
            DayOfWeek.WEDNESDAY, "MIERCOLES",
            DayOfWeek.THURSDAY, "JUEVES",
            DayOfWeek.FRIDAY, "VIERNES",
            DayOfWeek.SATURDAY, "SABADO",
            DayOfWeek.SUNDAY, "DOMINGO");

    private final ServicioRepository servicioRepository;
    private final CitaRepository citaRepository;
    private final ConfiguracionService configuracionService;

    public DisponibilidadService(ServicioRepository servicioRepository,
                                 CitaRepository citaRepository,
                                 ConfiguracionService configuracionService) {
        this.servicioRepository = servicioRepository;
        this.citaRepository = citaRepository;
        this.configuracionService = configuracionService;
    }

    @Transactional(readOnly = true)
    public DisponibilidadResponse obtenerHorariosDisponibles(LocalDate fecha, Long servicioId) {
        Servicio servicio = servicioRepository.findById(servicioId)
                .filter(Servicio::isActivo)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado o inactivo"));

        ConfiguracionDto.HorarioDia horario = horarioDelDia(fecha);
        List<String> horarios = new ArrayList<>();
        if (horario == null || !horario.isActivo()) {
            return new DisponibilidadResponse(fecha, servicioId, horarios);
        }

        LocalTime abre = parseHora(horario.getAbre());
        LocalTime cierra = parseHora(horario.getCierra());
        if (abre == null || cierra == null || !cierra.isAfter(abre)) {
            return new DisponibilidadResponse(fecha, servicioId, horarios);
        }

        int duracion = servicio.getDuracionMinutos();
        List<Cita> ocupadas = citasQueBloqueanEn(fecha);

        LocalDateTime ahora = LocalDateTime.now();
        for (LocalTime hora = abre; hora.plusMinutes(duracion).compareTo(cierra) <= 0; hora = hora.plusMinutes(PASO_MINUTOS)) {
            LocalDateTime inicio = fecha.atTime(hora);
            LocalDateTime fin = inicio.plusMinutes(duracion);
            if (inicio.isBefore(ahora)) {
                continue;
            }
            if (!seSuperpone(inicio, fin, ocupadas)) {
                horarios.add(hora.toString());
            }
        }
        return new DisponibilidadResponse(fecha, servicioId, horarios);
    }

    @Transactional(readOnly = true)
    public boolean estaDentroDeHorarioDeAtencion(LocalDateTime inicio, LocalDateTime fin) {
        ConfiguracionDto.HorarioDia horario = horarioDelDia(inicio.toLocalDate());
        if (horario == null || !horario.isActivo()) {
            return false;
        }
        LocalTime abre = parseHora(horario.getAbre());
        LocalTime cierra = parseHora(horario.getCierra());
        if (abre == null || cierra == null) {
            return false;
        }
        return !inicio.toLocalTime().isBefore(abre) && !fin.toLocalTime().isAfter(cierra);
    }

    private ConfiguracionDto.HorarioDia horarioDelDia(LocalDate fecha) {
        Map<String, ConfiguracionDto.HorarioDia> horarioSemanal =
                configuracionService.parsearHorario(configuracionService.obtenerOMeterDefault().getHorarioJson());
        String clave = DIA_CLAVE.get(fecha.getDayOfWeek());
        return horarioSemanal.get(clave);
    }

    private List<Cita> citasQueBloqueanEn(LocalDate fecha) {
        LocalDateTime desde = fecha.atStartOfDay();
        LocalDateTime hasta = fecha.plusDays(1).atStartOfDay();
        return citaRepository.findByFechaHoraInicioBetweenAndEstadoInOrderByFechaHoraInicioAsc(desde, hasta, ESTADOS_QUE_BLOQUEAN);
    }

    private boolean seSuperpone(LocalDateTime inicio, LocalDateTime fin, List<Cita> ocupadas) {
        for (Cita cita : ocupadas) {
            LocalDateTime cInicio = cita.getFechaHoraInicio();
            LocalDateTime cFin = cita.getFechaHoraFin();
            if (inicio.isBefore(cFin) && fin.isAfter(cInicio)) {
                return true;
            }
        }
        return false;
    }

    private LocalTime parseHora(String hora) {
        if (hora == null || hora.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(hora.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}