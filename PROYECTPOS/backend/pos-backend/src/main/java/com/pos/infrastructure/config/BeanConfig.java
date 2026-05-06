package com.pos.infrastructure.config;

import com.pos.domain.port.out.ProductoRepository;
import com.pos.domain.port.out.TokenRepository;
import com.pos.domain.port.out.UsuarioRepository;
import com.pos.domain.port.out.VentaRepository;
import com.pos.domain.service.*;
// InventarioService, ListarVentasService, ReporteService, DevolucionService, AuthService all in domain.service
import com.pos.infrastructure.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Punto de ensamblaje de la arquitectura hexagonal.
 * Es la única clase que conoce tanto las interfaces del dominio
 * como las implementaciones concretas de infraestructura.
 */
@Configuration
public class BeanConfig {

    @Bean
    public CalculadoraVenta calculadoraVenta() {
        return new CalculadoraVenta();
    }

    @Bean
    public ProductoService productoService(ProductoRepository productoRepository) {
        return new ProductoService(productoRepository);
    }

    @Bean
    public VentaService ventaService(ProductoRepository productoRepository,
                                     VentaRepository ventaRepository,
                                     CalculadoraVenta calculadora) {
        return new VentaService(productoRepository, ventaRepository, calculadora);
    }

    @Bean
    public ListarVentasService listarVentasService(VentaRepository ventaRepository) {
        return new ListarVentasService(ventaRepository);
    }

    @Bean
    public AuthService authService(UsuarioRepository usuarioRepository,
                                   TokenRepository tokenRepository,
                                   JwtService jwtService) {
        return new AuthService(usuarioRepository, tokenRepository, jwtService);
    }

    @Bean
    public InventarioService inventarioService(ProductoRepository productoRepository) {
        return new InventarioService(productoRepository);
    }

    @Bean
    public DevolucionService devolucionService(VentaRepository ventaRepository,
                                               ProductoRepository productoRepository) {
        return new DevolucionService(ventaRepository, productoRepository);
    }

    @Bean
    public ReporteService reporteService(VentaRepository ventaRepository) {
        return new ReporteService(ventaRepository);
    }
}
