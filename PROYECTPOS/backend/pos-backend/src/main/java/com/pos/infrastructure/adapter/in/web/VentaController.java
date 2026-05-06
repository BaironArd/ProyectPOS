package com.pos.infrastructure.adapter.in.web;

import com.pos.domain.model.Venta;
import com.pos.domain.port.in.*;
import com.pos.infrastructure.adapter.in.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ventas")
public class VentaController {

    private final ConfirmarVentaUseCase confirmarVenta;
    private final ObtenerVentaUseCase obtenerVenta;
    private final ListarVentasUseCase listarVentas;
    private final DevolverVentaUseCase devolverVenta;

    public VentaController(ConfirmarVentaUseCase confirmarVenta,
                            ObtenerVentaUseCase obtenerVenta,
                            ListarVentasUseCase listarVentas,
                            DevolverVentaUseCase devolverVenta) {
        this.confirmarVenta = confirmarVenta;
        this.obtenerVenta = obtenerVenta;
        this.listarVentas = listarVentas;
        this.devolverVenta = devolverVenta;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<VentaResponse>> confirmar(
            @RequestBody @Valid ConfirmarVentaRequest request) {

        ConfirmarVentaCommand command = toCommand(request);
        Venta venta = confirmarVenta.confirmar(command);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(toResponse(venta)));
    }

    @GetMapping("/{ventaId}")
    public ResponseEntity<ApiResponse<VentaResponse>> obtener(@PathVariable String ventaId) {
        Venta venta = obtenerVenta.obtener(ventaId);
        return ResponseEntity.ok(ApiResponse.of(toResponse(venta)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var resultado = listarVentas.listar(page, size);
        return ResponseEntity.ok(ApiResponse.of(resultado));
    }

    @PostMapping("/{ventaId}/devolucion")
    @Transactional
    public ResponseEntity<ApiResponse<DevolucionResponse>> devolver(@PathVariable String ventaId) {
        var devolucion = devolverVenta.devolver(ventaId);
        return ResponseEntity.ok(ApiResponse.of(new DevolucionResponse(
                devolucion.getVentaId(),
                devolucion.getMontoDevuelto().toPesos(),
                "DEVUELTA",
                devolucion.getFechaDevolucion()
        )));
    }

    // ---- Mappers ----

    private ConfirmarVentaCommand toCommand(ConfirmarVentaRequest req) {
        List<ConfirmarVentaCommand.ItemCommand> items = req.items().stream()
                .map(i -> new ConfirmarVentaCommand.ItemCommand(i.productoId(), i.cantidad()))
                .toList();

        List<ConfirmarVentaCommand.PagoItemCommand> pagos = req.pagos() != null
                ? req.pagos().stream()
                        .map(p -> new ConfirmarVentaCommand.PagoItemCommand(p.metodo(), p.monto(), p.referencia()))
                        .toList()
                : List.of();

        // Si el frontend no envía idempotencyKey, generar uno en el servidor
        String idempotencyKey = (req.idempotencyKey() != null && !req.idempotencyKey().isBlank())
                ? req.idempotencyKey()
                : java.util.UUID.randomUUID().toString();

        return new ConfirmarVentaCommand(
                items,
                req.montoPagado(),
                idempotencyKey,
                req.usuarioCajero(),
                req.metodoPago(),
                pagos
        );
    }

    private VentaResponse toResponse(Venta venta) {
        List<VentaResponse.ItemVentaResponse> items = venta.getItems().stream()
                .map(i -> new VentaResponse.ItemVentaResponse(
                        i.getProductoId(),
                        i.getNombre(),
                        i.getCantidad(),
                        i.getPrecioUnitario().toPesos(),
                        i.getSubtotal().toPesos()))
                .toList();

        VentaResponse.ResumenResponse resumen = new VentaResponse.ResumenResponse(
                venta.getResumen().subtotal().toPesos(),
                venta.getResumen().iva().toPesos(),
                venta.getResumen().total().toPesos(),
                venta.getResumen().montoPagado().toPesos(),
                venta.getResumen().cambio().toPesos()
        );

        return new VentaResponse(
                venta.getVentaId(),
                items,
                resumen,
                venta.getEstado().name(),
                venta.getFechaHora()
        );
    }
}
