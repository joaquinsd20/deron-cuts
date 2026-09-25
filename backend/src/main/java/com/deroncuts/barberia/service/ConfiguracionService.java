package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.ConfiguracionDto;
import com.deroncuts.barberia.dto.request.ActualizarConfiguracionRequest;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.model.ConfiguracionNegocio;
import com.deroncuts.barberia.repository.ConfiguracionNegocioRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class ConfiguracionService {

    private final ConfiguracionNegocioRepository repository;
    private final ObjectMapper objectMapper;

    public ConfiguracionService(ConfiguracionNegocioRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public ConfiguracionDto obtener() {
        return toDto(obtenerOMeterDefault());
    }

    @Transactional
    public ConfiguracionDto actualizar(ActualizarConfiguracionRequest request) {
        ConfiguracionNegocio config = obtenerOMeterDefault();
        config.setNombreNegocio(request.getNombreNegocio());
        config.setNombreBarbero(request.getNombreBarbero());
        config.setTelefono(request.getTelefono());
        config.setEmail(request.getEmail());
        config.setDireccion(request.getDireccion());
        config.setEnlaceMapa(request.getEnlaceMapa());
        config.setInstagram(request.getInstagram());
        config.setTiktok(request.getTiktok());
        config.setDescripcionBarbero(request.getDescripcionBarbero());
        config.setHorarioJson(serializarHorario(request.getHorario()));
        config.setRecordatoriosActivo(request.getRecordatoriosActivo());
        config.setRecordatoriosAntesHoras(request.getRecordatoriosAntesHoras());
        config.setWhatsappActivo(request.getWhatsappActivo());
        return toDto(repository.save(config));
    }

    @Transactional
    public ConfiguracionNegocio obtenerOMeterDefault() {
        ConfiguracionNegocio config = repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(crearConfiguracionDefault()));
        boolean cambios = false;
        if (config.getRecordatoriosActivo() == null) {
            config.setRecordatoriosActivo(true);
            cambios = true;
        }
        if (config.getRecordatoriosAntesHoras() == null) {
            config.setRecordatoriosAntesHoras(2);
            cambios = true;
        }
        if (config.getWhatsappActivo() == null) {
            config.setWhatsappActivo(false);
            cambios = true;
        }
        return cambios ? repository.save(config) : config;
    }

    private ConfiguracionNegocio crearConfiguracionDefault() {
        ConfiguracionNegocio config = new ConfiguracionNegocio();
        config.setTelefono("+51 990 750 147");
        config.setEmail("hola@deroncuts.com");
        config.setDireccion("Valeriano 362 - Huaman");
        config.setEnlaceMapa("https://maps.app.goo.gl/Fs3wnPjCqfNzZGhG7");
        config.setInstagram("https://instagram.com/deroncuts");
        config.setTiktok("https://tiktok.com/@deroncuts");
        config.setDescripcionBarbero(
                "Yumpi es el barbero detrás de DERON CUTS: fades, degradados y barba con un ojo " +
                "en los detalles, adaptando cada corte a tu estilo. Atención de uno a uno, sin apuro, " +
                "con buena música y mejor ambiente.");
        config.setHorarioJson(horarioDefault());
        config.setRecordatoriosActivo(true);
        config.setRecordatoriosAntesHoras(2);
        config.setWhatsappActivo(false);
        return config;
    }

    public Map<String, ConfiguracionDto.HorarioDia> parsearHorario(String horarioJson) {
        try {
            if (horarioJson == null || horarioJson.isBlank()) {
                return parsearHorario(horarioDefault());
            }
            return objectMapper.readValue(horarioJson, new TypeReference<Map<String, ConfiguracionDto.HorarioDia>>() {
            });
        } catch (Exception e) {
            throw new BusinessException("El horario configurado no es válido");
        }
    }

    public String serializarHorario(Map<String, ConfiguracionDto.HorarioDia> horario) {
        try {
            return objectMapper.writeValueAsString(horario);
        } catch (Exception e) {
            throw new BusinessException("El horario no pudo guardarse correctamente");
        }
    }

    public ConfiguracionDto toDto(ConfiguracionNegocio config) {
        ConfiguracionDto dto = new ConfiguracionDto();
        dto.setId(config.getId());
        dto.setNombreNegocio(config.getNombreNegocio());
        dto.setNombreBarbero(config.getNombreBarbero());
        dto.setTelefono(config.getTelefono());
        dto.setEmail(config.getEmail());
        dto.setDireccion(config.getDireccion());
        dto.setEnlaceMapa(config.getEnlaceMapa());
        dto.setInstagram(config.getInstagram());
        dto.setTiktok(config.getTiktok());
        dto.setDescripcionBarbero(config.getDescripcionBarbero());
        dto.setHorario(parsearHorario(config.getHorarioJson()));
        dto.setRecordatoriosActivo(config.getRecordatoriosActivo() == null
                ? true
                : config.getRecordatoriosActivo());
        dto.setRecordatoriosAntesHoras(config.getRecordatoriosAntesHoras() == null
                ? 2
                : config.getRecordatoriosAntesHoras());
        dto.setWhatsappActivo(config.getWhatsappActivo() == null
                ? false
                : config.getWhatsappActivo());
        return dto;
    }

    public String horarioDefault() {
        return "{\"LUNES\":{\"abre\":\"10:00\",\"cierra\":\"20:00\",\"activo\":true},"
                + "\"MARTES\":{\"abre\":\"10:00\",\"cierra\":\"20:00\",\"activo\":true},"
                + "\"MIERCOLES\":{\"abre\":\"10:00\",\"cierra\":\"20:00\",\"activo\":true},"
                + "\"JUEVES\":{\"abre\":\"10:00\",\"cierra\":\"20:00\",\"activo\":true},"
                + "\"VIERNES\":{\"abre\":\"10:00\",\"cierra\":\"20:00\",\"activo\":true},"
                + "\"SABADO\":{\"abre\":\"10:00\",\"cierra\":\"18:00\",\"activo\":true},"
                + "\"DOMINGO\":{\"abre\":\"10:00\",\"cierra\":\"14:00\",\"activo\":false}}";
    }
}