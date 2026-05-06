package com.pos.util;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad para generar hashes BCrypt para data.sql.
 * Ejecutar una vez y copiar los hashes al data.sql.
 * No es un test de producción — solo una herramienta de desarrollo.
 */
class GenerarHashesTest {

    @Test
    void generarHashes() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("Hash de '1234':     " + encoder.encode("1234"));
        System.out.println("Hash de 'admin123': " + encoder.encode("admin123"));
    }
}
