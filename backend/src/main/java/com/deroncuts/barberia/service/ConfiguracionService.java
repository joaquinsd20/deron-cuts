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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ConfiguracionService {

    private final ConfiguracionNegocioRepository repository;
    private final ObjectMapper objectMapper;
    private final ArchivoService archivoService;

    public ConfiguracionService(ConfiguracionNegocioRepository repository, ObjectMapper objectMapper,
                                ArchivoService archivoService) {
        this.archivoService = archivoService;
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /**
     * Copia en memoria de la configuración (cambia muy poco). Así la portada, el ping de
     * cron-job.org y el chequeo de salud de Render siguen respondiendo aunque TiDB tenga
     * un corte breve: antes, un corte de la base hacía que Render reiniciara el servidor.
     * Sin @Transactional a propósito: una transacción pediría conexión aunque haya copia.
     */
    private volatile ConfiguracionDto cache;

    /** Vacía la copia en memoria (por ejemplo, tras subir un QR nuevo). */
    public void refrescar() {
        cache = null;
    }

    /** Número de Yape configurado o, si no hay, el teléfono del negocio (9 dígitos). */
    public static String numeroYape(ConfiguracionNegocio c) {
        if (c.getYapeNumero() != null && !c.getYapeNumero().isBlank()) return c.getYapeNumero();
        String tel = c.getTelefono() == null ? "" : c.getTelefono().replaceAll("[^0-9]", "");
        return tel.length() > 9 ? tel.substring(tel.length() - 9) : tel;
    }

    public ConfiguracionDto obtener() {
        ConfiguracionDto actual = cache;
        if (actual == null) {
            actual = toDto(obtenerOMeterDefault());
            cache = actual;
        }
        return actual;
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
        if (request.getYapeNumero() != null) {
            String num = request.getYapeNumero().replaceAll("[^0-9]", "");
            config.setYapeNumero(num.isEmpty() ? null : num);
        }
        if (request.getYapeTitular() != null) {
            config.setYapeTitular(request.getYapeTitular().isBlank() ? null : request.getYapeTitular().trim());
        }
        if (request.getCorreoReportes() != null) {
            config.setCorreoReportes(request.getCorreoReportes().isBlank() ? null : request.getCorreoReportes().trim());
        }
        if (request.getMetodosPago() != null) {
            List<String> metodos = normalizarMetodos(request.getMetodosPago());
            if (metodos.isEmpty()) {
                throw new BusinessException("Deja al menos un método de pago");
            }
            config.setMetodosPago(String.join(",", metodos));
        }
        ConfiguracionDto guardada = toDto(repository.save(config));
        cache = guardada;
        return guardada;
    }

    public static final String METODOS_DEFAULT = "EFECTIVO,YAPE,PLIN";

    /** Métodos de pago que acepta el negocio (los configura el barbero en el panel). */
    @Transactional(readOnly = true)
    public List<String> metodosPago() {
        return metodosDe(obtenerOMeterDefault());
    }

    private List<String> metodosDe(ConfiguracionNegocio config) {
        String valor = config.getMetodosPago();
        return normalizarMetodos(java.util.Arrays.asList(
                (valor == null || valor.isBlank() ? METODOS_DEFAULT : valor).split(",")));
    }

    /** "  yape " → "YAPE"; quita vacíos y repetidos; máx. 10 métodos de 30 caracteres. */
    public static List<String> normalizarMetodos(List<String> entrada) {
        java.util.LinkedHashSet<String> salida = new java.util.LinkedHashSet<>();
        for (String m : entrada) {
            if (m == null) continue;
            String limpio = m.trim().replaceAll("\\s+", " ").replace(",", "").toUpperCase(java.util.Locale.ROOT);
            if (limpio.isEmpty()) continue;
            if (limpio.length() > 30) {
                throw new BusinessException("El nombre del método de pago no puede superar 30 caracteres");
            }
            salida.add(limpio);
        }
        if (salida.size() > 10) {
            throw new BusinessException("Puedes tener hasta 10 métodos de pago");
        }
        return new ArrayList<>(salida);
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
        dto.setMetodosPago(metodosDe(config));
        dto.setYapeNumero(numeroYape(config));
        dto.setYapeTitular(config.getYapeTitular());
        dto.setCorreoReportes(config.getCorreoReportes());
        java.time.LocalDateTime qr = archivoService.fechaDe(ArchivoService.QR_PAGO);
        // Sin QR subido desde el panel se usa el de la landing (/pagos/yape-qr.jpg).
        dto.setQrPagoUrl(qr == null ? "/pagos/yape-qr.jpg"
                : "/api/public/pagos/qr?v=" + qr.toEpochSecond(java.time.ZoneOffset.UTC));
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