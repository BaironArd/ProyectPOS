package com.pos.domain.service;

import com.pos.domain.exception.ProductoDuplicadoException;
import com.pos.domain.exception.ProductoNotFoundException;
import com.pos.domain.model.Dinero;
import com.pos.domain.model.Producto;
import com.pos.domain.port.in.ActualizarProductoCommand;
import com.pos.domain.port.in.GestionarProductoUseCase;
import com.pos.domain.port.in.NuevoProductoCommand;
import com.pos.domain.port.out.ProductoRepository;

import java.util.List;

/**
 * Servicio de dominio — POJO sin anotaciones de Spring.
 * Gestión de inventario para el rol ADMIN (SPEC-BE-010).
 */
public class InventarioService implements GestionarProductoUseCase {

    private final ProductoRepository productoRepository;

    public InventarioService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @Override
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    @Override
    public Producto crear(NuevoProductoCommand command) {
        productoRepository.findByNombreIgnoreCase(command.nombre())
                .filter(Producto::isActivo)
                .ifPresent(p -> { throw new ProductoDuplicadoException(command.nombre()); });

        Producto nuevo = new Producto(
                null,
                command.nombre(),
                Dinero.dePesos(command.precio()),
                command.stock(),
                command.categoria(),
                true
        );
        return productoRepository.save(nuevo);
    }

    @Override
    public Producto actualizar(Long id, ActualizarProductoCommand command) {
        Producto existente = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNotFoundException(id));
        existente.setNombre(command.nombre());
        existente.setPrecio(Dinero.dePesos(command.precio()));
        existente.setStock(command.stock());
        existente.setCategoria(command.categoria());
        return productoRepository.save(existente);
    }

    @Override
    public Producto toggleActivo(Long id) {
        Producto existente = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNotFoundException(id));
        existente.toggleActivo();
        return productoRepository.save(existente);
    }
}
