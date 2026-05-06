package com.pos.domain.exception;

public class TokenInvalidoException extends RuntimeException {
    public TokenInvalidoException() {
        super("El token JWT es inválido o ha expirado.");
    }
}
