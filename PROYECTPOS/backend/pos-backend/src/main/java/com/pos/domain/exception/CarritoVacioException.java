package com.pos.domain.exception;

public class CarritoVacioException extends RuntimeException {
    public CarritoVacioException() {
        super("No se puede confirmar una venta con el carrito vacío.");
    }
}
