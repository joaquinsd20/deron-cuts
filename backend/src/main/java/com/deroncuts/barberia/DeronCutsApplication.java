package com.deroncuts.barberia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DeronCutsApplication {

    public static void main(String[] args) {
        // Render corre en UTC; el negocio opera en hora de Perú. Sin esto, "hoy",
        // los horarios disponibles y los recordatorios se calculan 5 horas adelantados.
        String zona = System.getenv().getOrDefault("APP_TIMEZONE", "America/Lima");
        java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone(zona));
        SpringApplication.run(DeronCutsApplication.class, args);
    }
}