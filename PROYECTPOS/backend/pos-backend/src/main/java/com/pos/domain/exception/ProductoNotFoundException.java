package com.pos.domain.exception;

public class ProductoNotFoundException extends RuntimeException {
    public ProductoNotFoundException(Long id) {
        super(String.format("No existe un producto con id %d.", id));
    }
}
