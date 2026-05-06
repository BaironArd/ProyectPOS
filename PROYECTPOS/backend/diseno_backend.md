
# Diseño del Sistema — Backend POS
**Versión:** 1.3
**Referencia:** especificaciones_backend.md v1.3
**Tecnología:** Java 21 · Spring Boot 3 · Maven · JPA/Hibernate · H2 (dev) / PostgreSQL (prod)
**Arquitectura:** Hexagonal (Ports & Adapters) con inversión de dependencias (DIP)

---

## 1. Principio de diseño

Cada decisión estructural se justifica por una spec. La arquitectura hexagonal garantiza que el **dominio no depende de nada externo**: ni de Spring, ni de JPA, ni de HTTP. Las capas externas dependen del dominio; nunca al revés.

> Regla de oro: si cambias la base de datos de H2 a PostgreSQL, o el framework de Spring a Quarkus, el dominio no se toca.

> **Corolario crítico:** las clases del paquete `domain/` no pueden tener anotaciones de Spring (`@Service`, `@Component`, `@Autowired`) ni de JPA (`@Entity`, `@Column`). El cableado entre interfaces y sus implementaciones se hace exclusivamente en `BeanConfig.java` (capa de infraestructura).

---

## 2. Arquitectura Hexagonal — Vista general

```
+------------------------------------------------------------------+
|                    ADAPTADORES DE ENTRADA                        |
|              (Driving Side - quien llama al dominio)             |
|                                                                  |
|   ProductoController   VentaController   GlobalExceptionHandler  |
|         (HTTP / REST - Spring MVC)                               |
+---------------------------+--------------------------------------+
                            | usa puerto de entrada
+---------------------------v--------------------------------------+
|                    PUERTOS DE ENTRADA                            |
|              (Interfaces definidas por el dominio)               |
|                                                                  |
|   BuscarProductosUseCase    ConfirmarVentaUseCase               |
|   ObtenerProductoUseCase    ObtenerVentaUseCase                 |
|   ListarVentasUseCase       LoginUseCase  LogoutUseCase         |
|   DevolverVentaUseCase      GestionarProductoUseCase            |
|   GenerarReporteUseCase                                         |
+---------------------------+--------------------------------------+
                            | implementado por
+---------------------------v--------------------------------------+
|                    DOMINIO (NUCLEO)                              |
|         No depende de Spring, JPA, ni ningun framework          |
|                                                                  |
|   Entities:   Producto · Venta · ItemVenta · Usuario           |
|   Services:   ProductoService · VentaService · AuthService     |
|               DevolucionService · InventarioService            |
|               ReporteService · ListarVentasService             |
|   Value Obj:  Dinero · ResumenVenta · PageResponse             |
|   Domain Ex:  StockInsuficienteException · MontoInsuficiente...|
|               CredencialesInvalidasException · AccesoDenegado..|
|               VentaYaDevueltaException · ProductoDuplicado...  |
+---------------------------+--------------------------------------+
                            | usa puerto de salida
+---------------------------v--------------------------------------+
|                    PUERTOS DE SALIDA                             |
|         (Interfaces definidas por el dominio)                   |
|                                                                  |
|   ProductoRepository   VentaRepository                          |
+---------------------------+--------------------------------------+
                            | implementado por
+---------------------------v--------------------------------------+
|                    ADAPTADORES DE SALIDA                         |
|              (Driven Side - llamado por el dominio)              |
|                                                                  |
|   ProductoJpaAdapter   VentaJpaAdapter                          |
|         (Spring Data JPA - infraestructura)                      |
+------------------------------------------------------------------+
```

**Regla de dependencias:**
`Controller -> UseCase (interfaz) <- Service (POJO) -> Repository (interfaz) <- JpaAdapter`

Las flechas apuntan siempre **hacia el dominio**. El dominio no tiene ninguna flecha saliente.

---

## 3. Principios SOLID aplicados

| Principio | Aplicación concreta en este proyecto |
|---|---|
| **S** — Single Responsibility | `ProductoService` solo gestiona productos. `VentaService` solo gestiona ventas. `CalculadoraVenta` solo calcula totales. `AuthService` solo gestiona autenticación. `ReporteService` solo genera reportes. Cada clase tiene una razón para cambiar. |
| **O** — Open/Closed | Agregar un nuevo método de pago (ej. tarjeta) no modifica `VentaService`. Se agrega un nuevo `PagoStrategy` sin tocar código existente. |
| **L** — Liskov Substitution | `ProductoJpaAdapter` es sustituible por `ProductoInMemoryAdapter` en tests. Ambos implementan `ProductoRepository` sin cambiar el comportamiento esperado. |
| **I** — Interface Segregation | `BuscarProductosUseCase` y `ObtenerProductoUseCase` son interfaces separadas. `LoginUseCase` y `LogoutUseCase` son interfaces separadas. Un controlador que solo busca no depende de métodos que no usa. |
| **D** — Dependency Inversion | `VentaService` depende de `ProductoRepository` (interfaz de dominio), no de `ProductoJpaAdapter` (clase concreta de infraestructura). `BeanConfig` inyecta la implementación en runtime. |

---

## 4. Diagrama de secuencia — Confirmar venta (SPEC-BE-003)

```
Cliente HTTP        VentaController       VentaService         ProductoRepository    VentaRepository
     |                    |                    |                       |                    |
     |  POST /ventas       |                    |                       |                    |
     +-------------------->|                    |                       |                    |
     |                    |  confirmar(cmd)     |                       |                    |
     |                    +-------------------->|                       |                    |
     |                    |                    | findById(productoId)  |                    |
     |                    |                    +----------------------->|                    |
     |                    |                    |<-----------------------+                    |
     |                    |                    |  [valida stock]        |                    |
     |                    |                    |  [calcula totales]     |                    |
     |                    |                    |  [valida montoPagado]  |                    |
     |                    |                    | save(venta)            |                    |
     |                    |                    +------------------------------------------>|
     |                    |                    |<------------------------------------------+
     |                    |                    | saveAll(productos)    |                    |
     |                    |                    +----------------------->|                    |
     |                    |  VentaResponse      |                       |                    |
     |                    |<--------------------+                       |                    |
     |  201 + body         |                    |                       |                    |
     |<--------------------+                    |                       |                    |
```

---

## 5. Diagrama de secuencia — Error de dominio (SPEC-BE-005)

```
Cliente HTTP       VentaController      VentaService      GlobalExceptionHandler
     |                   |                   |                      |
     |  POST /ventas      |                   |                      |
     +------------------>|                   |                      |
     |                   | confirmar()        |                      |
     |                   +------------------>|                      |
     |                   |                   | throw                |
     |                   |                   | StockInsuficiente    |
     |                   |                   | Exception            |
     |                   |                   +--------------------->|
     |                   |                   |                      | mapea a
     |                   |                   |                      | ErrorResponse
     |  422 + ErrorBody   |                   |                      |
     |<------------------+-------------------+----------------------+
```

---

## 6. Modelo de dominio

### Entidades

Las entidades del dominio son POJOs puros. **Ninguna clase de este paquete tiene anotaciones de Spring ni de JPA.**

```java
// domain/model/Producto.java
public class Producto {
    private Long id;
    private String nombre;
    private Dinero precio;
    private int stock;
    private String categoria;

    public boolean tieneStock(int cantidad) {
        return this.stock >= cantidad;
    }

    public void descontarStock(int cantidad) {
        if (!tieneStock(cantidad)) {
            throw new StockInsuficienteException(this.id, cantidad, this.stock);
        }
        this.stock -= cantidad;
    }
}

// domain/model/Venta.java
public class Venta {
    private String ventaId;
    private List<ItemVenta> items;
    private ResumenVenta resumen;
    private EstadoVenta estado;
    private Instant fechaHora;
    private String idempotencyKey;
    private String usuarioCajero;    // SPEC-BE-011: para reporte por cajero
    private List<PagoItem> pagos;    // SPEC-BE-003 + SPEC-014 frontend: métodos de pago
}

// domain/model/Usuario.java  — SPEC-BE-008
public class Usuario {
    private Long id;
    private String usuario;
    private String passwordHash;
    private Rol rol;
    private boolean activo;
}

// domain/model/Rol.java  — SPEC-BE-008
public enum Rol { CAJERO, ADMIN }

// domain/model/SesionToken.java  — SPEC-BE-008
public record SesionToken(String token, String usuario, Rol rol, long expiresIn) {}

// domain/model/Devolucion.java  — SPEC-BE-009
public class Devolucion {
    private String ventaId;
    private Dinero montoDevuelto;
    private Instant fechaDevolucion;
}

// domain/model/ReporteCierre.java  — SPEC-BE-011
public record ReporteCierre(
    String fechaDesde,
    String fechaHasta,
    int totalVentas,
    int totalDevueltas,
    Dinero montoTotal,
    Dinero montoDevuelto,
    Dinero montoNeto,
    List<VentasPorCajero> ventasPorCajero
) {}

public record VentasPorCajero(String usuario, int ventas, Dinero monto) {}

// domain/model/PagoItem.java  — SPEC-BE-003 (métodos de pago)
public record PagoItem(MetodoPago metodo, Dinero monto, String referencia) {}

// domain/model/MetodoPago.java
public enum MetodoPago { EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO, TRANSFERENCIA }

// domain/model/ItemVenta.java
public class ItemVenta {
    private Long productoId;
    private String nombre;
    private int cantidad;
    private Dinero precioUnitario;
    private Dinero subtotal;
}
```

### Value Objects

```java
// domain/model/Dinero.java
public record Dinero(long centavos) {
    public static final Dinero CERO = new Dinero(0);
    public static final double IVA_RATE = 0.19;

    public Dinero mas(Dinero otro)        { return new Dinero(this.centavos + otro.centavos); }
    public Dinero menos(Dinero otro)      { return new Dinero(this.centavos - otro.centavos); }
    public Dinero por(int factor)         { return new Dinero(this.centavos * factor); }
    public Dinero iva()                   { return new Dinero(Math.round(this.centavos * IVA_RATE)); }
    public boolean esMenorQue(Dinero otro){ return this.centavos < otro.centavos; }

    /** Convierte a pesos enteros para serializar en la API (centavos / 100 si se usa esa escala,
     *  o directamente si centavos ya representa pesos enteros como en este proyecto). */
    public long toPesos() { return this.centavos; }

    public static Dinero dePesos(long pesos) { return new Dinero(pesos); }
}

// domain/model/ResumenVenta.java
public record ResumenVenta(
    Dinero subtotal,
    Dinero iva,
    Dinero total,
    Dinero montoPagado,
    Dinero cambio
) {}

// domain/model/PageResponse.java  — Value Object para respuestas paginadas (SPEC-BE-001b, SPEC-BE-006)
public record PageResponse<T>(
    List<T> items,
    long total,
    int page,
    int size,
    int totalPages
) {
    public static <T> PageResponse<T> of(List<T> items, long total, int page, int size) {
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(items, total, page, size, totalPages);
    }
}
```

> **Nota:** `Dinero` usa `long centavos` como campo interno. En este proyecto los precios se almacenan en pesos enteros (sin fracciones de centavo), por lo que `centavos` equivale a pesos. El método `toPesos()` serializa el valor para la API. Si en el futuro se requieren centavos reales, solo cambia la escala sin afectar el dominio.

### Excepciones de dominio

```java
// domain/exception/StockInsuficienteException.java
public class StockInsuficienteException extends RuntimeException { ... }

// domain/exception/MontoInsuficienteException.java
public class MontoInsuficienteException extends RuntimeException { ... }

// domain/exception/ProductoNotFoundException.java
public class ProductoNotFoundException extends RuntimeException { ... }

// domain/exception/VentaNotFoundException.java
public class VentaNotFoundException extends RuntimeException { ... }

// domain/exception/CarritoVacioException.java
public class CarritoVacioException extends RuntimeException { ... }

// domain/exception/QueryDemasiadoCortaException.java
public class QueryDemasiadoCortaException extends RuntimeException { ... }

// domain/exception/ConflictoStockException.java
public class ConflictoStockException extends RuntimeException { ... }
// Lanzada cuando JPA detecta OptimisticLockException — el GlobalExceptionHandler la mapea a 409 CONFLICTO_STOCK

// domain/exception/CredencialesInvalidasException.java
public class CredencialesInvalidasException extends RuntimeException { ... }

// domain/exception/TokenInvalidoException.java
public class TokenInvalidoException extends RuntimeException { ... }

// domain/exception/AccesoDenegadoException.java
public class AccesoDenegadoException extends RuntimeException { ... }

// domain/exception/VentaYaDevueltaException.java
public class VentaYaDevueltaException extends RuntimeException { ... }

// domain/exception/VentaNoDevolvibleException.java
public class VentaNoDevolvibleException extends RuntimeException { ... }

// domain/exception/ProductoDuplicadoException.java
public class ProductoDuplicadoException extends RuntimeException { ... }
```

Todas extienden `RuntimeException` (unchecked). No tienen imports de Spring ni de HTTP.

---

## 7. Puertos (interfaces de dominio)

### Puertos de entrada (Use Cases)

```java
// domain/port/in/BuscarProductosUseCase.java
public interface BuscarProductosUseCase {
    List<Producto> buscar(String query);
}

// domain/port/in/ObtenerProductoUseCase.java
public interface ObtenerProductoUseCase {
    Producto obtener(Long id);
}

// domain/port/in/ConfirmarVentaUseCase.java
public interface ConfirmarVentaUseCase {
    Venta confirmar(ConfirmarVentaCommand command);
}

// domain/port/in/ObtenerVentaUseCase.java
public interface ObtenerVentaUseCase {
    Venta obtener(String ventaId);
}

// domain/port/in/ListarVentasUseCase.java  — SPEC-BE-006
public interface ListarVentasUseCase {
    PageResponse<ResumenVentaSimple> listar(int page, int size);
}

// domain/port/in/LoginUseCase.java  — SPEC-BE-008
public interface LoginUseCase {
    SesionToken login(String usuario, String contrasena);
}

// domain/port/in/LogoutUseCase.java  — SPEC-BE-008
public interface LogoutUseCase {
    void logout(String token);
}

// domain/port/in/DevolverVentaUseCase.java  — SPEC-BE-009
public interface DevolverVentaUseCase {
    Devolucion devolver(String ventaId);
}

// domain/port/in/GestionarProductoUseCase.java  — SPEC-BE-010
public interface GestionarProductoUseCase {
    List<Producto> listarTodos();
    Producto crear(NuevoProductoCommand command);
    Producto actualizar(Long id, ActualizarProductoCommand command);
    Producto toggleActivo(Long id);
}

// domain/port/in/GenerarReporteUseCase.java  — SPEC-BE-011
public interface GenerarReporteUseCase {
    ReporteCierre generar(String fechaDesde, String fechaHasta);
}
```

### Comandos (entrada tipada al dominio)

```java
// domain/port/in/ConfirmarVentaCommand.java
public record ConfirmarVentaCommand(
    List<ItemCommand> items,
    long montoPagado,
    String idempotencyKey   // SPEC-BE-003: UUID generado por el frontend
) {
    public record ItemCommand(Long productoId, int cantidad) {}
}
```

### Puertos de salida (Repositorios)

```java
// domain/port/out/ProductoRepository.java
public interface ProductoRepository {
    List<Producto> buscarPorNombre(String query);
    Optional<Producto> findById(Long id);
    void save(Producto producto);
    void saveAll(List<Producto> productos);
}

// domain/port/out/VentaRepository.java
public interface VentaRepository {
    Venta save(Venta venta);
    Optional<Venta> findById(String ventaId);
    Optional<Venta> findByIdempotencyKey(String key);
    PageResponse<ResumenVentaSimple> findAll(int page, int size);
    ReporteCierre generarReporte(String fechaDesde, String fechaHasta);  // SPEC-BE-011
}

// domain/port/out/UsuarioRepository.java  — SPEC-BE-008
public interface UsuarioRepository {
    Optional<Usuario> findByUsuario(String usuario);
}

// domain/port/out/TokenRepository.java  — SPEC-BE-008 (blacklist de tokens)
public interface TokenRepository {
    void invalidar(String token);
    boolean esValido(String token);
}
```

---

## 8. Servicios de dominio (POJOs puros — sin anotaciones de Spring)

Los servicios de dominio son POJOs. Spring los instancia a través de `BeanConfig.java` en la capa de infraestructura. Esto garantiza que el dominio no depende del framework.

```java
// domain/service/ProductoService.java
public class ProductoService implements BuscarProductosUseCase, ObtenerProductoUseCase {

    private final ProductoRepository productoRepository; // puerto, no JPA

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;  // DIP: inyectado por constructor
    }

    @Override
    public List<Producto> buscar(String query) {
        if (query == null || query.trim().length() < 2) {
            throw new QueryDemasiadoCortaException(query);
        }
        return productoRepository.buscarPorNombre(query.trim());
    }

    @Override
    public Producto obtener(Long id) {
        return productoRepository.findById(id)
            .orElseThrow(() -> new ProductoNotFoundException(id));
    }
}

// domain/service/VentaService.java
public class VentaService implements ConfirmarVentaUseCase, ObtenerVentaUseCase {

    private final ProductoRepository productoRepository;
    private final VentaRepository ventaRepository;
    private final CalculadoraVenta calculadora;

    // DIP: todos inyectados por constructor, todos son interfaces o POJOs de dominio
    public VentaService(ProductoRepository productoRepository,
                        VentaRepository ventaRepository,
                        CalculadoraVenta calculadora) { ... }

    @Override
    public Venta confirmar(ConfirmarVentaCommand command) {
        if (command.items().isEmpty()) throw new CarritoVacioException();

        // Idempotencia: si la clave ya fue procesada, retornar la venta existente (SPEC-BE-003)
        if (command.idempotencyKey() != null) {
            Optional<Venta> existente = ventaRepository.findByIdempotencyKey(command.idempotencyKey());
            if (existente.isPresent()) return existente.get();
        }

        List<Producto> productos = resolverProductos(command.items());
        List<ItemVenta> items = construirItems(command.items(), productos);
        ResumenVenta resumen = calculadora.calcular(items, Dinero.dePesos(command.montoPagado()));

        if (resumen.cambio().esMenorQue(Dinero.CERO)) {
            throw new MontoInsuficienteException(resumen.total(), Dinero.dePesos(command.montoPagado()));
        }

        productos.forEach(p -> p.descontarStock(cantidadDe(p, command)));
        productoRepository.saveAll(productos);
        // Si saveAll lanza OptimisticLockException (concurrencia), el adaptador la convierte
        // en ConflictoStockException → GlobalExceptionHandler → 409 CONFLICTO_STOCK (SPEC-BE-007)

        Venta venta = new Venta(generarId(), items, resumen, EstadoVenta.COMPLETADA,
                                Instant.now(), command.idempotencyKey());
        return ventaRepository.save(venta);
    }

    @Override
    public Venta obtener(String ventaId) {
        return ventaRepository.findById(ventaId)
            .orElseThrow(() -> new VentaNotFoundException(ventaId));
    }
}
```

### Calculadora de venta (servicio de dominio puro)

```java
// domain/service/CalculadoraVenta.java
public class CalculadoraVenta {

    public ResumenVenta calcular(List<ItemVenta> items, Dinero montoPagado) {
        Dinero subtotal = items.stream()
            .map(ItemVenta::subtotal)
            .reduce(Dinero.CERO, Dinero::mas);

        Dinero iva    = subtotal.iva();
        Dinero total  = subtotal.mas(iva);
        Dinero cambio = montoPagado.menos(total);

        return new ResumenVenta(subtotal, iva, total, montoPagado, cambio);
    }
}
```

---

## 9. Cableado de dependencias — BeanConfig

`BeanConfig` es la única clase que conoce tanto las interfaces del dominio como las implementaciones concretas. Es el punto de ensamblaje de la arquitectura hexagonal.

```java
// infrastructure/config/BeanConfig.java
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
    public ListarVentasUseCase listarVentasUseCase(VentaRepository ventaRepository) {
        return new ListarVentasService(ventaRepository);
    }

    @Bean
    public AuthService authService(UsuarioRepository usuarioRepository,
                                   TokenRepository tokenRepository) {
        return new AuthService(usuarioRepository, tokenRepository);
    }

    @Bean
    public DevolucionService devolucionService(VentaRepository ventaRepository,
                                               ProductoRepository productoRepository) {
        return new DevolucionService(ventaRepository, productoRepository);
    }

    @Bean
    public InventarioService inventarioService(ProductoRepository productoRepository) {
        return new InventarioService(productoRepository);
    }

    @Bean
    public ReporteService reporteService(VentaRepository ventaRepository) {
        return new ReporteService(ventaRepository);
    }
}
```

> Spring inyecta `ProductoRepository` y `VentaRepository` con sus implementaciones JPA (`ProductoJpaAdapter`, `VentaJpaAdapter`) porque esas clases tienen `@Repository` y están en el classpath. El dominio nunca ve esas clases concretas.

> En tests unitarios, `BeanConfig` no se carga. Los servicios se instancian directamente con mocks de Mockito.

---

## 10. Adaptadores

### Adaptador de entrada: Controllers (REST)

```java
// infrastructure/adapter/in/web/ProductoController.java
@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {

    private final BuscarProductosUseCase buscarProductos;
    private final ObtenerProductoUseCase obtenerProducto;

    // DIP: inyeccion de interfaces, no de implementaciones concretas
    public ProductoController(BuscarProductosUseCase buscarProductos,
                               ObtenerProductoUseCase obtenerProducto) { ... }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductoResponse>>> buscar(
            @RequestParam @Size(min = 2) String q) {
        List<Producto> productos = buscarProductos.buscar(q);
        return ResponseEntity.ok(ApiResponse.of(ProductoMapper.toResponseList(productos)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoResponse>> obtener(@PathVariable Long id) {
        Producto producto = obtenerProducto.obtener(id);
        return ResponseEntity.ok(ApiResponse.of(ProductoMapper.toResponse(producto)));
    }
}

// infrastructure/adapter/in/web/VentaController.java
@RestController
@RequestMapping("/api/v1/ventas")
public class VentaController {

    private final ConfirmarVentaUseCase confirmarVenta;
    private final ObtenerVentaUseCase obtenerVenta;

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<VentaResponse>> confirmar(
            @RequestBody @Valid ConfirmarVentaRequest request) {
        ConfirmarVentaCommand command = VentaMapper.toCommand(request);
        Venta venta = confirmarVenta.confirmar(command);
        return ResponseEntity.status(201).body(ApiResponse.of(VentaMapper.toResponse(venta)));
    }

    @GetMapping("/{ventaId}")
    public ResponseEntity<ApiResponse<VentaResponse>> obtener(@PathVariable String ventaId) {
        Venta venta = obtenerVenta.obtener(ventaId);
        return ResponseEntity.ok(ApiResponse.of(VentaMapper.toResponse(venta)));
    }
}
```

> **Nota:** `@Transactional` se coloca en el controller (o en un servicio de aplicación) para garantizar la atomicidad de SPEC-BE-003. El `VentaService` de dominio no tiene esta anotación porque no depende de Spring.

### Adaptador de salida: JPA Repositories

```java
// infrastructure/adapter/out/persistence/ProductoJpaAdapter.java
@Repository
public class ProductoJpaAdapter implements ProductoRepository {

    private final ProductoJpaRepository jpaRepository;
    private final ProductoEntityMapper mapper;

    @Override
    public List<Producto> buscarPorNombre(String query) {
        return jpaRepository.findByNombreContainingIgnoreCase(query)
            .stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Producto> findById(Long id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public void saveAll(List<Producto> productos) {
        jpaRepository.saveAll(productos.stream().map(mapper::toEntity).toList());
    }

    @Override
    public void save(Producto producto) {
        jpaRepository.save(mapper.toEntity(producto));
    }
}
```

### Manejador global de errores

```java
// infrastructure/adapter/in/web/GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductoNotFoundException.class)
    public ResponseEntity<ErrorResponse> handle(ProductoNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(ErrorResponse.of("PRODUCTO_NO_ENCONTRADO", ex.getMessage()));
    }

    @ExceptionHandler(StockInsuficienteException.class)
    public ResponseEntity<ErrorResponse> handle(StockInsuficienteException ex) {
        return ResponseEntity.status(422)
            .body(ErrorResponse.of("STOCK_INSUFICIENTE", ex.getMessage()));
    }

    @ExceptionHandler(MontoInsuficienteException.class)
    public ResponseEntity<ErrorResponse> handle(MontoInsuficienteException ex) {
        return ResponseEntity.status(422)
            .body(ErrorResponse.of("VENTA_MONTO_INSUFICIENTE", ex.getMessage()));
    }

    @ExceptionHandler(CarritoVacioException.class)
    public ResponseEntity<ErrorResponse> handle(CarritoVacioException ex) {
        return ResponseEntity.status(422)
            .body(ErrorResponse.of("CARRITO_VACIO", ex.getMessage()));
    }

    @ExceptionHandler(VentaNotFoundException.class)
    public ResponseEntity<ErrorResponse> handle(VentaNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(ErrorResponse.of("VENTA_NO_ENCONTRADA", ex.getMessage()));
    }

    @ExceptionHandler(QueryDemasiadoCortaException.class)
    public ResponseEntity<ErrorResponse> handle(QueryDemasiadoCortaException ex) {
        return ResponseEntity.status(400)
            .body(ErrorResponse.of("QUERY_DEMASIADO_CORTA", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.status(400)
            .body(ErrorResponse.of("VALIDACION_FALLIDA", mensaje));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        // log.error("Error inesperado", ex) — registrar internamente, no exponer al cliente
        return ResponseEntity.status(500)
            .body(ErrorResponse.of("ERROR_INTERNO", "Ocurrio un error inesperado."));
    }

    @ExceptionHandler(ConflictoStockException.class)
    public ResponseEntity<ErrorResponse> handle(ConflictoStockException ex) {
        return ResponseEntity.status(409)
            .body(ErrorResponse.of("CONFLICTO_STOCK",
                "El stock fue modificado por otra operación. Por favor reintenta."));
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ErrorResponse> handle(CredencialesInvalidasException ex) {
        return ResponseEntity.status(401)
            .body(ErrorResponse.of("CREDENCIALES_INVALIDAS", "Usuario o contraseña incorrectos."));
    }

    @ExceptionHandler(TokenInvalidoException.class)
    public ResponseEntity<ErrorResponse> handle(TokenInvalidoException ex) {
        return ResponseEntity.status(401)
            .body(ErrorResponse.of("TOKEN_INVALIDO", "La sesión ha expirado. Por favor inicia sesión nuevamente."));
    }

    @ExceptionHandler(AccesoDenegadoException.class)
    public ResponseEntity<ErrorResponse> handle(AccesoDenegadoException ex) {
        return ResponseEntity.status(403)
            .body(ErrorResponse.of("ACCESO_DENEGADO", "No tienes permisos para realizar esta operación."));
    }

    @ExceptionHandler(VentaYaDevueltaException.class)
    public ResponseEntity<ErrorResponse> handle(VentaYaDevueltaException ex) {
        return ResponseEntity.status(422)
            .body(ErrorResponse.of("VENTA_YA_DEVUELTA", ex.getMessage()));
    }

    @ExceptionHandler(VentaNoDevolvibleException.class)
    public ResponseEntity<ErrorResponse> handle(VentaNoDevolvibleException ex) {
        return ResponseEntity.status(422)
            .body(ErrorResponse.of("VENTA_NO_DEVOLVIBLE", ex.getMessage()));
    }

    @ExceptionHandler(ProductoDuplicadoException.class)
    public ResponseEntity<ErrorResponse> handle(ProductoDuplicadoException ex) {
        return ResponseEntity.status(409)
            .body(ErrorResponse.of("PRODUCTO_DUPLICADO", ex.getMessage()));
    }
}
```

---

## 11. Estructura de directorios

```
src/main/java/com/pos/
|
+-- domain/
|   +-- model/
|   |   +-- Producto.java
|   |   +-- Venta.java
|   |   +-- ItemVenta.java
|   |   +-- Usuario.java              <- SPEC-BE-008
|   |   +-- Rol.java                  <- Enum: CAJERO, ADMIN
|   |   +-- SesionToken.java          <- Value Object (SPEC-BE-008)
|   |   +-- Devolucion.java           <- SPEC-BE-009
|   |   +-- ReporteCierre.java        <- Value Object (SPEC-BE-011)
|   |   +-- VentasPorCajero.java      <- Value Object (SPEC-BE-011)
|   |   +-- PagoItem.java             <- Value Object (SPEC-BE-003 + métodos de pago)
|   |   +-- MetodoPago.java           <- Enum: EFECTIVO, TARJETA_DEBITO, etc.
|   |   +-- Dinero.java              <- Value Object (record)
|   |   +-- ResumenVenta.java        <- Value Object (record)
|   |   +-- ResumenVentaSimple.java  <- Value Object para historial (SPEC-BE-006)
|   |   +-- PageResponse.java        <- Value Object generico paginacion (SPEC-BE-001b)
|   |   +-- EstadoVenta.java         <- Enum: COMPLETADA, CANCELADA, DEVUELTA
|   |
|   +-- port/
|   |   +-- in/                      <- Use Cases (interfaces)
|   |   |   +-- BuscarProductosUseCase.java
|   |   |   +-- ObtenerProductoUseCase.java
|   |   |   +-- ConfirmarVentaUseCase.java
|   |   |   +-- ObtenerVentaUseCase.java
|   |   |   +-- ListarVentasUseCase.java      <- SPEC-BE-006
|   |   |   +-- LoginUseCase.java             <- SPEC-BE-008
|   |   |   +-- LogoutUseCase.java            <- SPEC-BE-008
|   |   |   +-- DevolverVentaUseCase.java     <- SPEC-BE-009
|   |   |   +-- GestionarProductoUseCase.java <- SPEC-BE-010
|   |   |   +-- GenerarReporteUseCase.java    <- SPEC-BE-011
|   |   |   +-- ConfirmarVentaCommand.java    <- incluye idempotencyKey (SPEC-BE-003)
|   |   +-- out/                     <- Repositorios (interfaces)
|   |       +-- ProductoRepository.java
|   |       +-- VentaRepository.java
|   |       +-- UsuarioRepository.java    <- SPEC-BE-008
|   |       +-- TokenRepository.java      <- SPEC-BE-008 (blacklist JWT)
|   |
|   +-- service/
|   |   +-- ProductoService.java     <- POJO, implementa BuscarProductos + ObtenerProducto
|   |   +-- VentaService.java        <- POJO, implementa ConfirmarVenta + ObtenerVenta
|   |   +-- ListarVentasService.java <- POJO, implementa ListarVentasUseCase (SPEC-BE-006)
|   |   +-- AuthService.java         <- POJO, implementa LoginUseCase + LogoutUseCase (SPEC-BE-008)
|   |   +-- DevolucionService.java   <- POJO, implementa DevolverVentaUseCase (SPEC-BE-009)
|   |   +-- InventarioService.java   <- POJO, implementa GestionarProductoUseCase (SPEC-BE-010)
|   |   +-- ReporteService.java      <- POJO, implementa GenerarReporteUseCase (SPEC-BE-011)
|   |   +-- CalculadoraVenta.java    <- POJO, servicio de dominio puro
|   |
|   +-- exception/
|       +-- StockInsuficienteException.java
|       +-- MontoInsuficienteException.java
|       +-- ProductoNotFoundException.java
|       +-- VentaNotFoundException.java
|       +-- CarritoVacioException.java
|       +-- QueryDemasiadoCortaException.java
|       +-- ConflictoStockException.java      <- SPEC-BE-007
|       +-- CredencialesInvalidasException.java <- SPEC-BE-008
|       +-- TokenInvalidoException.java         <- SPEC-BE-008
|       +-- AccesoDenegadoException.java        <- SPEC-BE-008, SPEC-BE-010, SPEC-BE-011
|       +-- VentaYaDevueltaException.java       <- SPEC-BE-009
|       +-- VentaNoDevolvibleException.java     <- SPEC-BE-009
|       +-- ProductoDuplicadoException.java     <- SPEC-BE-010
|
+-- infrastructure/
    +-- adapter/
    |   +-- in/
    |   |   +-- web/
    |   |       +-- ProductoController.java
    |   |       +-- VentaController.java
    |   |       +-- AuthController.java           <- SPEC-BE-008 (login/logout)
    |   |       +-- AdminProductoController.java  <- SPEC-BE-010 (solo ADMIN)
    |   |       +-- ReporteController.java        <- SPEC-BE-011 (solo ADMIN)
    |   |       +-- GlobalExceptionHandler.java
    |   |       +-- dto/
    |   |       |   +-- request/
    |   |       |   |   +-- ConfirmarVentaRequest.java
    |   |       |   |   +-- ItemVentaRequest.java
    |   |       |   |   +-- LoginRequest.java
    |   |       |   |   +-- NuevoProductoRequest.java
    |   |       |   |   +-- ActualizarProductoRequest.java
    |   |       |   +-- response/
    |   |       |       +-- ApiResponse.java
    |   |       |       +-- ErrorResponse.java
    |   |       |       +-- ProductoResponse.java
    |   |       |       +-- VentaResponse.java
    |   |       |       +-- SesionTokenResponse.java
    |   |       |       +-- DevolucionResponse.java
    |   |       |       +-- ReporteCierreResponse.java
    |   |       +-- mapper/
    |   |           +-- ProductoMapper.java
    |   |           +-- VentaMapper.java
    |   |
    |   +-- out/
    |       +-- persistence/
    |           +-- ProductoJpaAdapter.java    <- implementa ProductoRepository
    |           +-- VentaJpaAdapter.java       <- implementa VentaRepository
    |           +-- UsuarioJpaAdapter.java     <- implementa UsuarioRepository (SPEC-BE-008)
    |           +-- TokenJpaAdapter.java       <- implementa TokenRepository (SPEC-BE-008)
    |           +-- entity/
    |           |   +-- ProductoEntity.java    <- @Entity JPA + @Version (optimistic locking SPEC-BE-007)
    |           |   +-- VentaEntity.java       <- @Column(unique=true) en idempotencyKey (SPEC-BE-003)
    |           |   +-- ItemVentaEntity.java
    |           |   +-- UsuarioEntity.java     <- @Entity JPA (SPEC-BE-008)
    |           |   +-- TokenBlacklistEntity.java <- @Entity JPA (SPEC-BE-008)
    |           +-- repository/
    |           |   +-- ProductoJpaRepository.java   <- extends JpaRepository
    |           |   +-- VentaJpaRepository.java
    |           +-- mapper/
    |               +-- ProductoEntityMapper.java
    |               +-- VentaEntityMapper.java
    |
    +-- config/
        +-- BeanConfig.java    <- @Configuration: cablea interfaces con implementaciones
        +-- CorsConfig.java    <- permite origen del frontend (localhost:5173)

src/test/java/com/pos/
    +-- domain/
    |   +-- service/
    |   |   +-- ProductoServiceTest.java
    |   |   +-- VentaServiceTest.java
    |   |   +-- CalculadoraVentaTest.java
    |   +-- model/
    |       +-- DineroTest.java
    +-- infrastructure/
        +-- adapter/in/web/
            +-- ProductoControllerTest.java
            +-- VentaControllerTest.java
```

---

## 12. Configuracion de dependencias (pom.xml — fragmento clave)

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
        <!-- SPEC-BE-008: autenticación JWT -->
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
        <!-- SPEC-BE-008: generación y validación de tokens JWT -->
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
        <!-- Producción: reemplaza H2 -->
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
        <!-- Incluye JUnit 5, Mockito y MockMvc -->
    </dependency>
    <dependency>
        <groupId>net.jqwik</groupId>
        <artifactId>jqwik</artifactId>
        <version>1.8.3</version>
        <scope>test</scope>
        <!-- Property-Based Testing para CalculadoraVenta -->
    </dependency>
</dependencies>
```

---

## 13. Decisiones de diseño justificadas por las specs

| Decision | Spec que la justifica |
|---|---|
| Servicios de dominio como POJOs (sin @Service) | DIP: el dominio no puede depender de Spring. `BeanConfig` hace el cableado en infraestructura. |
| `CalculadoraVenta` como POJO separado | SPEC-BE-003 requiere calculo de IVA, subtotal y cambio — SRP: una clase, una razon para cambiar. |
| `Dinero` como Value Object inmutable con `menos()` | SPEC-BE-003 opera con sumas y restas monetarias — `menos()` es necesario para calcular el cambio. |
| `@Transactional` en el controller, no en el servicio | SPEC-BE-003 exige atomicidad. El servicio de dominio no puede tener anotaciones de Spring. |
| Excepciones de dominio sin dependencia de Spring | SPEC-BE-005 exige mapeo uniforme — `GlobalExceptionHandler` en infraestructura hace esa traduccion. |
| Interfaces separadas por caso de uso (ISP) | `ProductoController` no deberia depender de metodos de venta. `LoginUseCase` separado de `LogoutUseCase`. |
| Mapper explicito entre entidad JPA y modelo de dominio | El modelo de dominio no puede tener anotaciones JPA — hacerlo violaria la independencia del dominio. |
| `CANTIDAD_INVALIDA` como codigo de error propio | SPEC-BE-003 define `cantidad <= 0` como caso de error diferenciado. |
| `idempotencyKey` en `ConfirmarVentaCommand` y `VentaEntity` | SPEC-BE-003: el frontend puede reintentar por timeout — sin idempotencia se crean ventas duplicadas. |
| `@Version` en `ProductoEntity` | SPEC-BE-007: dos cajeros vendiendo el ultimo stock simultaneamente — optimistic locking garantiza consistencia. |
| `PageResponse<T>` como Value Object generico | SPEC-BE-001b y SPEC-BE-006 requieren paginacion — un VO reutilizable evita duplicar la logica. |
| `ListarVentasService` separado de `VentaService` | SRP: listar ventas es una responsabilidad distinta a confirmar ventas. |
| `AuthService` como POJO de dominio | SPEC-BE-008: la logica de autenticacion (validar credenciales, generar token) es logica de negocio, no de infraestructura. |
| `TokenRepository` para blacklist de JWT | SPEC-BE-008: el logout debe invalidar el token en el servidor para evitar reutilizacion tras cierre de sesion. |
| `AccesoDenegadoException` en dominio | SPEC-BE-010, SPEC-BE-011: el control de acceso por rol es logica de negocio — el dominio lanza la excepcion, el handler la mapea a 403. |
| `DevolucionService` separado de `VentaService` | SRP: devolver una venta (restaurar stock, cambiar estado) es una responsabilidad distinta a confirmarla. |
| `ReporteService` separado | SRP: generar reportes agrega datos historicos — responsabilidad distinta a las operaciones transaccionales. |
| `EstadoVenta` incluye `DEVUELTA` | SPEC-BE-009: una venta devuelta debe tener un estado diferenciado para evitar doble devolucion. |
