package com.deroncuts.barberia.repository;

import com.deroncuts.barberia.model.ArchivoBinario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ArchivoBinarioRepository extends JpaRepository<ArchivoBinario, String> {

    /** Solo la fecha, sin cargar los bytes (para armar la URL del QR con ?v=…). */
    @Query("select a.actualizado from ArchivoBinario a where a.clave = :clave")
    Optional<LocalDateTime> fechaDe(String clave);
}
