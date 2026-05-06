package com.pos.domain.service;

import com.pos.domain.model.ReporteCierre;
import com.pos.domain.port.in.GenerarReporteUseCase;
import com.pos.domain.port.out.VentaRepository;

public class ReporteService implements GenerarReporteUseCase {

    private final VentaRepository ventaRepository;

    public ReporteService(VentaRepository ventaRepository) {
        this.ventaRepository = ventaRepository;
    }

    @Override
    public ReporteCierre generar(String fechaDesde, String fechaHasta) {
        return ventaRepository.generarReporte(fechaDesde, fechaHasta);
    }
}
