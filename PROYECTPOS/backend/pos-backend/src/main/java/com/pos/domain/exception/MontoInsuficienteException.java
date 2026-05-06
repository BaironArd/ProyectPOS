package com.pos.domain.exception;

import com.pos.domain.model.Dinero;

public class MontoInsuficienteException extends RuntimeException {
    public MontoInsuficienteException(Dinero total, Dinero montoPagado) {
        super(String.format(
            "Monto insuficiente. Total: %s, monto pagado: %s.",
            total.toPesos(), montoPagado.toPesos()));
    }
}
