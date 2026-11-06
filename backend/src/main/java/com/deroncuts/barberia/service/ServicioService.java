package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.ServicioDto;
import com.deroncuts.barberia.dto.request.ActualizarServicioRequest;
import com.deroncuts.barberia.dto.request.CrearServicioRequest;
import com.deroncuts.barberia.exception.BusinessException;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.Servicio;
import com.deroncuts.barberia.model.ServicioImagen;
import com.deroncuts.barberia.repository.ServicioImagenRepository;
import com.deroncuts.barberia.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;
    private final ServicioImagenRepository servicioImagenRepository;
    private final com.deroncuts.barberia.repository.CitaRepository citaRepository;

    public ServicioService(ServicioRepository servicioRepository,
                           ServicioImagenRepository servicioImagenRepository,
                           com.deroncuts.barberia.repository.CitaRepository citaRepository) {
        this.servicioRepository = servicioRepository;
        this.servicioImagenRepository = servicioImagenRepository;
        this.citaRepository = citaRepository;
    }

    @Transactional(readOnly = true)
    public List<ServicioDto> listarActivos() {
        return servicioRepository.findByActivoTrueAndEliminadoFalseOrderByIdAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ServicioDto> listarTodos() {
        return servicioRepository.findByEliminadoFalseOrderByIdAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ServicioDto crear(CrearServicioRequest request) {
        Servicio servicio = new Servicio();
        aplicarCampos(servicio, request.getNombre(), request.getDescripcion(),
                request.getPrecio(), request.getDuracionMinutos(), request.getImagenUrl(), request.isActivo());
        return toDto(servicioRepository.save(servicio));
    }

    @Transactional
    public ServicioDto actualizar(Long id, ActualizarServicioRequest request) {
        Servicio servicio = obtenerEntity(id);
        aplicarCampos(servicio, request.getNombre(), request.getDescripcion(),
                request.getPrecio(), request.getDuracionMinutos(), request.getImagenUrl(), request.isActivo());
        return toDto(servicioRepository.save(servicio));
    }

    @Transactional
    public ServicioDto cambiarActivo(Long id, boolean activo) {
        Servicio servicio = obtenerEntity(id);
        servicio.setActivo(activo);
        return toDto(servicioRepository.save(servicio));
    }

    private static final long MAX_IMAGEN_BYTES = 4L * 1024 * 1024;
    private static final java.util.Set<String> TIPOS_IMAGEN =
            java.util.Set.of("image/jpeg", "image/png", "image/webp");

    @Transactional
    public ServicioDto subirImagen(Long id, org.springframework.web.multipart.MultipartFile archivo) {
        Servicio servicio = obtenerEntity(id);
        if (archivo == null || archivo.isEmpty()) {
            throw new BusinessException("Selecciona una imagen");
        }
        String tipo = archivo.getContentType();
        if (tipo == null || !TIPOS_IMAGEN.contains(tipo)) {
            throw new BusinessException("La imagen debe ser JPG, PNG o WEBP");
        }
        if (archivo.getSize() > MAX_IMAGEN_BYTES) {
            throw new BusinessException("La imagen no puede superar 4 MB");
        }
        ServicioImagen imagen = servicioImagenRepository.findById(id).orElseGet(ServicioImagen::new);
        imagen.setServicioId(id);
        imagen.setContentType(tipo);
        try {
            imagen.setDatos(archivo.getBytes());
        } catch (java.io.IOException e) {
            throw new BusinessException("No se pudo leer la imagen");
        }
        servicioImagenRepository.save(imagen);
        // ?v= cambia en cada subida para que navegadores y CDN no muestren la foto anterior
        servicio.setImagenUrl("/api/public/servicios/" + id + "/imagen?v=" + System.currentTimeMillis());
        return toDto(servicioRepository.save(servicio));
    }

    /**
     * Sin citas: se borra de la base junto con su foto.
     * Con citas en el historial: se oculta para siempre (admin y landing), así las
     * citas y pagos pasados conservan el nombre del servicio.
     */
    @Transactional
    public void eliminar(Long id) {
        Servicio servicio = obtenerEntity(id);
        servicioImagenRepository.findById(id).ifPresent(servicioImagenRepository::delete);
        if (citaRepository.existsByServicioId(id)) {
            servicio.setEliminado(true);
            servicio.setActivo(false);
            servicio.setImagenUrl(null);
            servicioRepository.save(servicio);
        } else {
            servicioRepository.delete(servicio);
        }
    }

    @Transactional(readOnly = true)
    public ServicioImagen obtenerImagen(Long id) {
        return servicioImagenRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Imagen no encontrada"));
    }

    @Transactional(readOnly = true)
    public Servicio obtenerEntity(Long id) {
        return servicioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));
    }

    public ServicioDto toDto(Servicio servicio) {
        ServicioDto dto = new ServicioDto();
        dto.setId(servicio.getId());
        dto.setNombre(servicio.getNombre());
        dto.setDescripcion(servicio.getDescripcion());
        dto.setPrecio(servicio.getPrecio());
        dto.setDuracionMinutos(servicio.getDuracionMinutos());
        dto.setImagenUrl(servicio.getImagenUrl());
        dto.setActivo(servicio.isActivo());
        return dto;
    }

    private void aplicarCampos(Servicio servicio, String nombre, String descripcion,
                               java.math.BigDecimal precio, Integer duracionMinutos,
                               String imagenUrl, boolean activo) {
        servicio.setNombre(nombre.trim());
        servicio.setDescripcion(descripcion == null ? "" : descripcion.trim());
        servicio.setPrecio(precio);
        servicio.setDuracionMinutos(duracionMinutos);
        servicio.setImagenUrl(imagenUrl);
        servicio.setActivo(activo);
    }
}