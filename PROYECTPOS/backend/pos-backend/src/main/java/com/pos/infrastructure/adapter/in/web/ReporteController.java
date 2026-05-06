package com.pos.infrastructure.adapter.in.web;

import com.pos.domain.model.ReporteCierre;
import com.pos.domain.port.in.GenerarReporteUseCase;
import com.pos.infrastructure.adapter.in.web.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reportes")
@PreAuthorize("hasRole('ADMIN')")
public class ReporteController {

    private final GenerarReporteUseCase generarReporte;

    public ReporteController(GenerarReporteUseCase generarReporte) {
        this.generarReporte = generarReporte;
    }

    @GetMapping("/cierre")
    public ResponseEntity<ApiResponse<ReporteCierreResponse>> cierre(
            @RequestParam String fechaDesde,
            @RequestParam String fechaHasta) {

        ReporteCierre reporte = generarReporte.generar(fechaDesde, fechaHasta);

        ReporteCierreResponse response = new ReporteCierreResponse(
                reporte.fechaDesde(),
                reporte.fechaHasta(),
                reporte.totalVentas(),
                reporte.totalDevueltas(),
                reporte.montoTotal().toPesos(),
                reporte.montoDevuelto().toPesos(),
                reporte.montoNeto().toPesos(),
                reporte.ventasPorCajero().stream()
                        .map(v -> new VentasPorCajeroResponse(v.usuario(), v.ventas(), v.monto().toPesos()))
                        .toList()
        );

        return ResponseEntity.ok(ApiResponse.of(response));
    }

    public record ReporteCierreResponse(
            String fechaDesde, String fechaHasta,
            int totalVentas, int totalDevueltas,
            long montoTotal, long montoDevuelto, long montoNeto,
            java.util.List<VentasPorCajeroResponse> ventasPorCajero
    ) {}

    public record VentasPorCajeroResponse(String usuario, int ventas, long monto) {}
}
