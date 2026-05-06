package com.pos.domain.service;

import com.pos.domain.model.Dinero;
import com.pos.domain.model.ItemVenta;
import com.pos.domain.model.ResumenVenta;
import java.util.List;

/**
 * Servicio de dominio puro — POJO sin anotaciones de Spring.
 * Calcula el resumen financiero de una venta.
 * Directamente trazable a SPEC-BE-003.
 */
public class CalculadoraVenta {

    public ResumenVenta calcular(List<ItemVenta> items, Dinero montoPagado) {
        Dinero subtotal = items.stream()
                .map(ItemVenta::getSubtotal)
                .reduce(Dinero.CERO, Dinero::mas);

        Dinero iva    = subtotal.iva();
        Dinero total  = subtotal.mas(iva);
        Dinero cambio = montoPagado.menos(total);

        return new ResumenVenta(subtotal, iva, total, montoPagado, cambio);
    }
}
