package com.deroncuts.barberia.service;

import com.deroncuts.barberia.dto.ServicioDto;
import com.deroncuts.barberia.dto.request.ActualizarServicioRequest;
import com.deroncuts.barberia.dto.request.CrearServicioRequest;
import com.deroncuts.barberia.exception.NotFoundException;
import com.deroncuts.barberia.model.Servicio;
import com.deroncuts.barberia.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;

    public ServicioService(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    @Transactional(readOnly = true)
    public List<ServicioDto> listarActivos() {
        return servicioRepository.findByActivoTrueOrderByIdAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ServicioDto> listarTodos() {
        return servicioRepository.findAllByOrderByIdAsc()
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
        servicio.setNombre(nombre);
        servicio.setDescripcion(descripcion);
        servicio.setPrecio(precio);
        servicio.setDuracionMinutos(duracionMinutos);
        servicio.setImagenUrl(imagenUrl);
        servicio.setActivo(activo);
    }
}