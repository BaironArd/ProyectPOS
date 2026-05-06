package com.pos.infrastructure.adapter.in.web;

import com.pos.domain.exception.ProductoNotFoundException;
import com.pos.domain.exception.QueryDemasiadoCortaException;
import com.pos.domain.model.Dinero;
import com.pos.domain.model.Producto;
import com.pos.domain.port.in.BuscarProductosUseCase;
import com.pos.domain.port.in.ObtenerProductoUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductoController.class)
@Import(GlobalExceptionHandler.class)
class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BuscarProductosUseCase buscarProductos;

    @MockBean
    private ObtenerProductoUseCase obtenerProducto;

    private Producto productoMock() {
        return new Producto(1L, "Mouse Óptico USB", Dinero.dePesos(30000), 15, "Periféricos", true);
    }

    // ---- SPEC-BE-001: Buscar productos ----

    @Test
    @WithMockUser
    void buscar_conQueryValida_retorna200ConLista() throws Exception {
        when(buscarProductos.buscar("mouse")).thenReturn(List.of(productoMock()));

        mockMvc.perform(get("/api/v1/productos").param("q", "mouse"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].nombre").value("Mouse Óptico USB"))
                .andExpect(jsonPath("$.data[0].stock").value(15))
                .andExpect(jsonPath("$.data[0].precio").value(30000));
    }

    @Test
    @WithMockUser
    void buscar_sinResultados_retorna200ConArrayVacio() throws Exception {
        when(buscarProductos.buscar("xyz")).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/productos").param("q", "xyz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    @WithMockUser
    void buscar_conQueryCorta_retorna400ConCodigoEsperado() throws Exception {
        when(buscarProductos.buscar("a"))
                .thenThrow(new QueryDemasiadoCortaException("a"));

        mockMvc.perform(get("/api/v1/productos").param("q", "a"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.codigo").value("QUERY_DEMASIADO_CORTA"));
    }

    // ---- SPEC-BE-002: Obtener producto por ID ----

    @Test
    @WithMockUser
    void obtener_conIdExistente_retorna200() throws Exception {
        when(obtenerProducto.obtener(1L)).thenReturn(productoMock());

        mockMvc.perform(get("/api/v1/productos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.nombre").value("Mouse Óptico USB"));
    }

    @Test
    @WithMockUser
    void obtener_conIdInexistente_retorna404() throws Exception {
        when(obtenerProducto.obtener(99L))
                .thenThrow(new ProductoNotFoundException(99L));

        mockMvc.perform(get("/api/v1/productos/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.codigo").value("PRODUCTO_NO_ENCONTRADO"));
    }
}
