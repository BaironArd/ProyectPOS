package com.pos.domain.service;

import com.pos.domain.exception.VentaNoDevolvibleException;
import com.pos.domain.exception.VentaNotFoundException;
import com.pos.domain.exception.VentaYaDevueltaException;
import com.pos.domain.model.*;
import com.pos.domain.port.in.DevolverVentaUseCase;
import com.pos.domain.port.out.ProductoRepository;
import com.pos.domain.port.out.VentaRepository;

import java.time.Instant;

/**
 * Servicio de dominio — POJO sin anotaciones de Spring.
 */
public class DevolucionService implements DevolverVentaUseCase {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;

    public DevolucionService(VentaRepository ventaRepository,
                              ProductoRepository productoRepository) {
        this.ventaRepository = ventaRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    public Devolucion devolver(String ventaId) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new VentaNotFoundException(ventaId));

        if (venta.getEstado() == EstadoVenta.DEVUELTA) {
            throw new VentaYaDevueltaException(ventaId);
        }

        if (venta.getEstado() != EstadoVenta.COMPLETADA) {
            throw new VentaNoDevolvibleException(ventaId, venta.getEstado().name());
        }

        // Restaurar stock de cada producto
        for (ItemVenta item : venta.getItems()) {
            productoRepository.findById(item.getProductoId()).ifPresent(p -> {
                p.restaurarStock(item.getCantidad());
                productoRepository.save(p);
            });
        }

        // Cambiar estado de la venta
        venta.setEstado(EstadoVenta.DEVUELTA);
        ventaRepository.save(venta);

        return new Devolucion(
                ventaId,
                venta.getResumen().total(),
                Instant.now()
        );
    }
}
