package com.pos.domain.service;

import com.pos.domain.model.PageResponse;
import com.pos.domain.model.ResumenVentaSimple;
import com.pos.domain.port.in.ListarVentasUseCase;
import com.pos.domain.port.out.VentaRepository;

public class ListarVentasService implements ListarVentasUseCase {

    private final VentaRepository ventaRepository;

    public ListarVentasService(VentaRepository ventaRepository) {
        this.ventaRepository = ventaRepository;
    }

    @Override
    public PageResponse<ResumenVentaSimple> listar(int page, int size) {
        return ventaRepository.findAll(page, size);
    }
}
