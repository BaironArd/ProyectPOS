package com.pos.infrastructure.adapter.in.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.domain.exception.*;
import com.pos.domain.model.*;
import com.pos.domain.port.in.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VentaController.class)
@Import(GlobalExceptionHandler.class)
class VentaControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private ConfirmarVentaUseCase confirmarVenta;
    @MockBean private ObtenerVentaUseCase obtenerVenta;
    @MockBean private ListarVentasUseCase listarVentas;
    @MockBean private DevolverVentaUseCase devolverVenta;

    private Venta ventaMock() {
        ResumenVenta resumen = new ResumenVenta(
                Dinero.dePesos(115000), Dinero.dePesos(21850),
                Dinero.dePesos(136850), Dinero.dePesos(150000),
                Dinero.dePesos(13150));
        ItemVenta item = new ItemVenta(1L, "Mouse Óptico USB", 2, Dinero.dePesos(30000));
        return new Venta("VNT-20250115-001", List.of(item), resumen,
                EstadoVenta.COMPLETADA, Instant.now(), "key-001", "cajero01", List.of());
    }

    private String requestBody() throws Exception {
        return """
            {
              "items": [{"productoId": 1, "cantidad": 2}],
              "montoPagado": 150000,
              "idempotencyKey": "key-001",
              "metodoPago": "EFECTIVO"
            }
            """;
    }

    // ---- SPEC-BE-003: Confirmar venta ----

    @Test
    @WithMockUser
    void confirmar_exitoso_retorna201ConVentaId() throws Exception {
        when(confirmarVenta.confirmar(any())).thenReturn(ventaMock());

        mockMvc.perform(post("/api/v1/ventas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.ventaId").value("VNT-20250115-001"))
                .andExpect(jsonPath("$.data.resumen.cambio").value(13150))
                .andExpect(jsonPath("$.data.estado").value("COMPLETADA"));
    }

    @Test
    @WithMockUser
    void confirmar_carritoVacio_retorna422() throws Exception {
        when(confirmarVenta.confirmar(any())).thenThrow(new CarritoVacioException());

        mockMvc.perform(post("/api/v1/ventas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.codigo").value("CARRITO_VACIO"));
    }

    @Test
    @WithMockUser
    void confirmar_montoInsuficiente_retorna422() throws Exception {
        when(confirmarVenta.confirmar(any()))
                .thenThrow(new MontoInsuficienteException(Dinero.dePesos(136850), Dinero.dePesos(50000)));

        mockMvc.perform(post("/api/v1/ventas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.codigo").value("VENTA_MONTO_INSUFICIENTE"));
    }

    @Test
    @WithMockUser
    void confirmar_productoInexistente_retorna404() throws Exception {
        when(confirmarVenta.confirmar(any()))
                .thenThrow(new ProductoNotFoundException(99L));

        mockMvc.perform(post("/api/v1/ventas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.codigo").value("PRODUCTO_NO_ENCONTRADO"));
    }

    @Test
    @WithMockUser
    void confirmar_stockInsuficiente_retorna422() throws Exception {
        when(confirmarVenta.confirmar(any()))
                .thenThrow(new StockInsuficienteException(1L, 5, 2));

        mockMvc.perform(post("/api/v1/ventas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.codigo").value("STOCK_INSUFICIENTE"));
    }

    @Test
    @WithMockUser
    void confirmar_cantidadInvalida_retorna400() throws Exception {
        String bodyInvalido = """
            {
              "items": [{"productoId": 1, "cantidad": -1}],
              "montoPagado": 150000,
              "idempotencyKey": "key-001"
            }
            """;

        mockMvc.perform(post("/api/v1/ventas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyInvalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.codigo").value("VALIDACION_FALLIDA"));
    }

    // ---- SPEC-BE-004: Obtener venta ----

    @Test
    @WithMockUser
    void obtener_conIdExistente_retorna200() throws Exception {
        when(obtenerVenta.obtener("VNT-20250115-001")).thenReturn(ventaMock());

        mockMvc.perform(get("/api/v1/ventas/VNT-20250115-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ventaId").value("VNT-20250115-001"));
    }

    @Test
    @WithMockUser
    void obtener_conIdInexistente_retorna404() throws Exception {
        when(obtenerVenta.obtener("FALSO"))
                .thenThrow(new VentaNotFoundException("FALSO"));

        mockMvc.perform(get("/api/v1/ventas/FALSO"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.codigo").value("VENTA_NO_ENCONTRADA"));
    }

    // ---- SPEC-BE-005: Formato de error uniforme ----

    @Test
    @WithMockUser
    void error_siempreTieneFormatoUniforme() throws Exception {
        when(obtenerVenta.obtener(any()))
                .thenThrow(new VentaNotFoundException("X"));

        mockMvc.perform(get("/api/v1/ventas/X"))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.error.codigo").exists())
                .andExpect(jsonPath("$.error.mensaje").exists())
                .andExpect(jsonPath("$.error.timestamp").exists());
    }
}
