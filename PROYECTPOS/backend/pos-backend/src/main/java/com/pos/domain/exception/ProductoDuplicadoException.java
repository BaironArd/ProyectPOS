package com.pos.domain.exception;

public class ProductoDuplicadoException extends RuntimeException {
    public ProductoDuplicadoException(String nombre) {
        super(String.format("Ya existe un producto activo con el nombre '%s'.", nombre));
    }
}
