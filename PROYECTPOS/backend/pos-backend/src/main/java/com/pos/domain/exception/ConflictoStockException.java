package com.pos.domain.exception;

public class ConflictoStockException extends RuntimeException {
    public ConflictoStockException() {
        super("Conflicto de concurrencia al actualizar el stock. Por favor reintenta la operación.");
    }
}
