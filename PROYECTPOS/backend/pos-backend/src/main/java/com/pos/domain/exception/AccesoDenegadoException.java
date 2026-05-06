package com.pos.domain.exception;

public class AccesoDenegadoException extends RuntimeException {
    public AccesoDenegadoException(String rol) {
        super(String.format("El rol '%s' no tiene permiso para realizar esta operación.", rol));
    }
}
