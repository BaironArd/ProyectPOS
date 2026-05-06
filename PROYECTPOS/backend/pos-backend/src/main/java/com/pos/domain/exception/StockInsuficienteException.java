package com.pos.domain.exception;

public class StockInsuficienteException extends RuntimeException {
    public StockInsuficienteException(Long productoId, int solicitado, int disponible) {
        super(String.format(
            "Stock insuficiente para producto id=%d. Solicitado: %d, disponible: %d.",
            productoId, solicitado, disponible));
    }
}
