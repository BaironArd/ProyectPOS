package com.pos.domain.exception;

public class VentaNotFoundException extends RuntimeException {
    public VentaNotFoundException(String ventaId) {
        super(String.format("No existe una venta con id %s.", ventaId));
    }
}
