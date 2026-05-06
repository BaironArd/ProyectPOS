package com.pos.domain.exception;

public class VentaNoDevolvibleException extends RuntimeException {
    public VentaNoDevolvibleException(String ventaId, String estado) {
        super(String.format("La venta %s no puede ser devuelta porque su estado es '%s'.", ventaId, estado));
    }
}
