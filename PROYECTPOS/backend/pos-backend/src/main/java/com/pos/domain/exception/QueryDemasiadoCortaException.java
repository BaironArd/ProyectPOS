package com.pos.domain.exception;

public class QueryDemasiadoCortaException extends RuntimeException {
    public QueryDemasiadoCortaException(String query) {
        super(String.format(
            "El término de búsqueda debe tener al menos 2 caracteres. Recibido: '%s'.", query));
    }
}
