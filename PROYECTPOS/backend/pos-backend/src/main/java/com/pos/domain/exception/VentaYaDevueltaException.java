package com.pos.domain.exception;

public class VentaYaDevueltaException extends RuntimeException {
    public VentaYaDevueltaException(String ventaId) {
        super(String.format("La venta %s ya fue devuelta anteriormente.", ventaId));
    }
}
