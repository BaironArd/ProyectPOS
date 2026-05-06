package com.pos.infrastructure.adapter.in.web;

import com.pos.domain.model.Producto;
import com.pos.domain.port.in.*;
import com.pos.infrastructure.adapter.in.web.dto.ApiResponse;
import com.pos.infrastructure.adapter.in.web.dto.ProductoResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/productos")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductoController {

    private final GestionarProductoUseCase gestionarProducto;

    public AdminProductoController(GestionarProductoUseCase gestionarProducto) {
        this.gestionarProducto = gestionarProducto;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductoResponse>>> listar() {
        List<ProductoResponse> productos = gestionarProducto.listarTodos()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.of(productos));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductoResponse>> crear(
            @RequestBody @Valid NuevoProductoRequest request) {
        Producto p = gestionarProducto.crear(new NuevoProductoCommand(
                request.nombre(), request.precio(), request.stock(), request.categoria()));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(toResponse(p)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoResponse>> actualizar(
            @PathVariable Long id,
            @RequestBody @Valid ActualizarProductoRequest request) {
        Producto p = gestionarProducto.actualizar(id, new ActualizarProductoCommand(
                request.nombre(), request.precio(), request.stock(), request.categoria()));
        return ResponseEntity.ok(ApiResponse.of(toResponse(p)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<ProductoResponse>> toggle(@PathVariable Long id) {
        Producto p = gestionarProducto.toggleActivo(id);
        return ResponseEntity.ok(ApiResponse.of(toResponse(p)));
    }

    private ProductoResponse toResponse(Producto p) {
        return new ProductoResponse(p.getId(), p.getNombre(),
                p.getPrecio().toPesos(), p.getStock(), p.getCategoria(), p.isActivo());
    }

    public record NuevoProductoRequest(
            @NotBlank String nombre,
            @Positive long precio,
            int stock,
            String categoria
    ) {}

    public record ActualizarProductoRequest(
            @NotBlank String nombre,
            @Positive long precio,
            int stock,
            String categoria
    ) {}
}
