
# System Design — Backend POS
**Version:** 1.3
**Reference:** requirements.md v1.3
**Technology:** Java 21 · Spring Boot 3 · Maven · JPA/Hibernate · H2 (dev) / PostgreSQL (prod)
**Architecture:** Hexagonal (Ports & Adapters) with Dependency Inversion Principle (DIP)

---

## 1. Design Principle

Every structural decision is justified by a spec. The hexagonal architecture guarantees that the **domain does not depend on anything external**: not Spring, not JPA, not HTTP. The outer layers depend on the domain; never the other way around.

> Golden rule: if you switch the database from H2 to PostgreSQL, or the framework from Spring to Quarkus, the domain is untouched.

> **Critical corollary:** classes in the `domain/` package cannot have Spring annotations (`@Service`, `@Component`, `@Autowired`) or JPA annotations (`@Entity`, `@Column`). The wiring between interfaces and their implementations is done exclusively in `BeanConfig.java` (infrastructure layer).

---

## 2. Hexagonal Architecture — Overview

```
+------------------------------------------------------------------+
|                      INBOUND ADAPTERS                            |
|              (Driving Side - who calls the domain)               |
|                                                                  |
|   ProductoController   VentaController   GlobalExceptionHandler  |
|         (HTTP / REST - Spring MVC)                               |
+---------------------------+--------------------------------------+
                            | uses inbound port
+---------------------------v--------------------------------------+
|                      INBOUND PORTS                               |
|              (Interfaces defined by the domain)                  |
|                                                                  |
|   BuscarProductosUseCase    ConfirmarVentaUseCase               |
|   ObtenerProductoUseCase    ObtenerVentaUseCase                 |
|   ListarVentasUseCase       LoginUseCase  LogoutUseCase         |
|   DevolverVentaUseCase      GestionarProductoUseCase            |
|   GenerarReporteUseCase                                         |
+---------------------------+--------------------------------------+
                            | implemented by
+---------------------------v--------------------------------------+
|                      DOMAIN (CORE)                               |
|         Does not depend on Spring, JPA, or any framework        |
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
                            | uses outbound port
+---------------------------v--------------------------------------+
|                      OUTBOUND PORTS                              |
|         (Interfaces defined by the domain)                      |
|                                                                  |
|   ProductoRepository   VentaRepository                          |
+---------------------------+--------------------------------------+
                            | implemented by
+---------------------------v--------------------------------------+
|                      OUTBOUND ADAPTERS                           |
|              (Driven Side - called by the domain)                |
|                                                                  |
|   ProductoJpaAdapter   VentaJpaAdapter                          |
|         (Spring Data JPA - infrastructure)                       |
+------------------------------------------------------------------+
```

**Dependency rule:**
`Controller -> UseCase (interface) <- Service (POJO) -> Repository (interface) <- JpaAdapter`

Arrows always point **toward the domain**. The domain has no outgoing arrows.

---

## 3. SOLID Principles Applied

| Principle | Concrete application in this project |
|---|---|
| **S** — Single Responsibility | `ProductoService` only manages products. `VentaService` only manages sales. `CalculadoraVenta` only calculates totals. `AuthService` only manages authentication. `ReporteService` only generates reports. Each class has one reason to change. |
| **O** — Open/Closed | Adding a new payment method (e.g. card) does not modify `VentaService`. A new `PagoStrategy` is added without touching existing code. |
| **L** — Liskov Substitution | `ProductoJpaAdapter` is substitutable by `ProductoInMemoryAdapter` in tests. Both implement `ProductoRepository` without changing the expected behavior. |
| **I** — Interface Segregation | `BuscarProductosUseCase` and `ObtenerProductoUseCase` are separate interfaces. `LoginUseCase` and `LogoutUseCase` are separate interfaces. A controller that only searches does not depend on methods it does not use. |
| **D** — Dependency Inversion | `VentaService` depends on `ProductoRepository` (domain interface), not on `ProductoJpaAdapter` (concrete infrastructure class). `BeanConfig` injects the implementation at runtime. |

---

## 4. Sequence Diagram — Confirm Sale (SPEC-BE-003)

```
HTTP Client         VentaController       VentaService         ProductoRepository    VentaRepository
     |                    |                    |                       |                    |
     |  POST /ventas       |                    |                       |                    |
     +-------------------->|                    |                       |                    |
     |                    |  confirmar(cmd)     |                       |                    |
     |                    +-------------------->|                       |                    |
     |                    |                    | findById(productoId)  |                    |
     |                    |                    +----------------------->|                    |
     |                    |                    |<-----------------------+                    |
     |                    |                    |  [validate stock]      |                    |
     |                    |                    |  [calculate totals]    |                    |
     |                    |                    |  [validate amountPaid] |                    |
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

## 5. Sequence Diagram — Domain Error (SPEC-BE-005)

```
HTTP Client        VentaController      VentaService      GlobalExceptionHandler
     |                   |                   |                      |
     |  POST /ventas      |                   |                      |
     +------------------>|                   |                      |
     |                   | confirmar()        |                      |
     |                   +------------------>|                      |
     |                   |                   | throw                |
     |                   |                   | StockInsuficiente    |
     |                   |                   | Exception            |
     |                   |                   +--------------------->|
     |                   |                   |                      | maps to
     |                   |                   |                      | ErrorResponse
     |  422 + ErrorBody   |                   |                      |
     |<------------------+-------------------+----------------------+
```

---

## 6. Domain Model

### Entities

Domain entities are pure POJOs. **No class in this package has Spring or JPA annotations.**

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
    private String usuarioCajero;    // SPEC-BE-011: for report by cashier
    private List<PagoItem> pagos;    // SPEC-BE-003 + SPEC-014 frontend: payment methods
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

// domain/model/PagoItem.java  — SPEC-BE-003 (payment methods)
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

    /** Converts to whole pesos for API serialization (centavos / 100 if that scale is used,
     *  or directly if centavos already represents whole pesos as in this project). */
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

// domain/model/PageResponse.java  — Value Object for paginated responses (SPEC-BE-001b, SPEC-BE-006)
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

> **Note:** `Dinero` uses `long centavos` as its internal field. In this project prices are stored as whole pesos (no fractional cents), so `centavos` is equivalent to pesos. The `toPesos()` method serializes the value for the API. If fractional cents are needed in the future, only the scale changes without affecting the domain.

### Domain Exceptions

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
// Thrown when JPA detects OptimisticLockException — GlobalExceptionHandler maps it to 409 CONFLICTO_STOCK

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

All extend `RuntimeException` (unchecked). They have no Spring or HTTP imports.

---

## 7. Ports (Domain Interfaces)

### Inbound Ports (Use Cases)

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

### Commands (Typed Domain Input)

```java
// domain/port/in/ConfirmarVentaCommand.java
public record ConfirmarVentaCommand(
    List<ItemCommand> items,
    long montoPagado,
    String idempotencyKey   // SPEC-BE-003: UUID generated by the frontend
) {
    public record ItemCommand(Long productoId, int cantidad) {}
}
```

### Outbound Ports (Repositories)

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

// domain/port/out/TokenRepository.java  — SPEC-BE-008 (token blacklist)
public interface TokenRepository {
    void invalidar(String token);
    boolean esValido(String token);
}
```

---

## 8. Domain Services (Pure POJOs — no Spring annotations)

Domain services are POJOs. Spring instantiates them through `BeanConfig.java` in the infrastructure layer. This guarantees the domain does not depend on the framework.

```java
// domain/service/ProductoService.java
public class ProductoService implements BuscarProductosUseCase, ObtenerProductoUseCase {

    private final ProductoRepository productoRepository; // port, not JPA

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;  // DIP: injected by constructor
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

    // DIP: all injected by constructor, all are domain interfaces or POJOs
    public VentaService(ProductoRepository productoRepository,
                        VentaRepository ventaRepository,
                        CalculadoraVenta calculadora) { ... }

    @Override
    public Venta confirmar(ConfirmarVentaCommand command) {
        if (command.items().isEmpty()) throw new CarritoVacioException();

        // Idempotency: if the key was already processed, return the existing sale (SPEC-BE-003)
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
        // If saveAll throws OptimisticLockException (concurrency), the adapter converts it
        // to ConflictoStockException → GlobalExceptionHandler → 409 CONFLICTO_STOCK (SPEC-BE-007)

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

### Sale Calculator (Pure Domain Service)

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

## 9. Dependency Wiring — BeanConfig

`BeanConfig` is the only class that knows both the domain interfaces and the concrete implementations. It is the assembly point of the hexagonal architecture.

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

> Spring injects `ProductoRepository` and `VentaRepository` with their JPA implementations (`ProductoJpaAdapter`, `VentaJpaAdapter`) because those classes have `@Repository` and are on the classpath. The domain never sees those concrete classes.

> In unit tests, `BeanConfig` is not loaded. Services are instantiated directly with Mockito mocks.

---

## 10. Adapters

### Inbound Adapter: Controllers (REST)

```java
// infrastructure/adapter/in/web/ProductoController.java
@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {

    private final BuscarProductosUseCase buscarProductos;
    private final ObtenerProductoUseCase obtenerProducto;

    // DIP: injection of interfaces, not concrete implementations
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

> **Note:** `@Transactional` is placed on the controller (or an application service) to guarantee the atomicity of SPEC-BE-003. The domain `VentaService` does not have this annotation because it does not depend on Spring.

### Outbound Adapter: JPA Repositories

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

### Global Error Handler

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
        // log.error("Unexpected error", ex) — log internally, do not expose to client
        return ResponseEntity.status(500)
            .body(ErrorResponse.of("ERROR_INTERNO", "An unexpected error occurred."));
    }

    @ExceptionHandler(ConflictoStockException.class)
    public ResponseEntity<ErrorResponse> handle(ConflictoStockException ex) {
        return ResponseEntity.status(409)
            .body(ErrorResponse.of("CONFLICTO_STOCK",
                "Stock was modified by another operation. Please retry."));
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ErrorResponse> handle(CredencialesInvalidasException ex) {
        return ResponseEntity.status(401)
            .body(ErrorResponse.of("CREDENCIALES_INVALIDAS", "Invalid username or password."));
    }

    @ExceptionHandler(TokenInvalidoException.class)
    public ResponseEntity<ErrorResponse> handle(TokenInvalidoException ex) {
        return ResponseEntity.status(401)
            .body(ErrorResponse.of("TOKEN_INVALIDO", "Session has expired. Please log in again."));
    }

    @ExceptionHandler(AccesoDenegadoException.class)
    public ResponseEntity<ErrorResponse> handle(AccesoDenegadoException ex) {
        return ResponseEntity.status(403)
            .body(ErrorResponse.of("ACCESO_DENEGADO", "You do not have permission to perform this operation."));
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
})
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

## 11. Directory Structure

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
|   |   +-- PagoItem.java             <- Value Object (SPEC-BE-003 + payment methods)
|   |   +-- MetodoPago.java           <- Enum: EFECTIVO, TARJETA_DEBITO, etc.
|   |   +-- Dinero.java              <- Value Object (record)
|   |   +-- ResumenVenta.java        <- Value Object (record)
|   |   +-- ResumenVentaSimple.java  <- Value Object for history (SPEC-BE-006)
|   |   +-- PageResponse.java        <- Generic pagination Value Object (SPEC-BE-001b)
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
|   |   |   +-- ConfirmarVentaCommand.java    <- includes idempotencyKey (SPEC-BE-003)
|   |   +-- out/                     <- Repositories (interfaces)
|   |       +-- ProductoRepository.java
|   |       +-- VentaRepository.java
|   |       +-- UsuarioRepository.java    <- SPEC-BE-008
|   |       +-- TokenRepository.java      <- SPEC-BE-008 (JWT blacklist)
|   |
|   +-- service/
|   |   +-- ProductoService.java     <- POJO, implements BuscarProductos + ObtenerProducto
|   |   +-- VentaService.java        <- POJO, implements ConfirmarVenta + ObtenerVenta
|   |   +-- ListarVentasService.java <- POJO, implements ListarVentasUseCase (SPEC-BE-006)
|   |   +-- AuthService.java         <- POJO, implements LoginUseCase + LogoutUseCase (SPEC-BE-008)
|   |   +-- DevolucionService.java   <- POJO, implements DevolverVentaUseCase (SPEC-BE-009)
|   |   +-- InventarioService.java   <- POJO, implements GestionarProductoUseCase (SPEC-BE-010)
|   |   +-- ReporteService.java      <- POJO, implements GenerarReporteUseCase (SPEC-BE-011)
|   |   +-- CalculadoraVenta.java    <- POJO, pure domain service
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
    |   |       +-- AdminProductoController.java  <- SPEC-BE-010 (ADMIN only)
    |   |       +-- ReporteController.java        <- SPEC-BE-011 (ADMIN only)
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
    |           +-- ProductoJpaAdapter.java    <- implements ProductoRepository
    |           +-- VentaJpaAdapter.java       <- implements VentaRepository
    |           +-- UsuarioJpaAdapter.java     <- implements UsuarioRepository (SPEC-BE-008)
    |           +-- TokenJpaAdapter.java       <- implements TokenRepository (SPEC-BE-008)
    |           +-- entity/
    |           |   +-- ProductoEntity.java    <- @Entity JPA + @Version (optimistic locking SPEC-BE-007)
    |           |   +-- VentaEntity.java       <- @Column(unique=true) on idempotencyKey (SPEC-BE-003)
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
        +-- BeanConfig.java    <- @Configuration: wires interfaces with implementations
        +-- CorsConfig.java    <- allows frontend origin (localhost:5173)

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

## 12. Dependency Configuration (pom.xml — key fragment)

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
        <!-- SPEC-BE-008: JWT authentication -->
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
        <!-- SPEC-BE-008: JWT token generation and validation -->
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
        <!-- Production: replaces H2 -->
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
        <!-- Includes JUnit 5, Mockito and MockMvc -->
    </dependency>
    <dependency>
        <groupId>net.jqwik</groupId>
        <artifactId>jqwik</artifactId>
        <version>1.8.3</version>
        <scope>test</scope>
        <!-- Property-Based Testing for CalculadoraVenta -->
    </dependency>
</dependencies>
```

---

## 13. Design Decisions Justified by Specs

| Decision | Justifying spec |
|---|---|
| Domain services as POJOs (no @Service) | DIP: the domain cannot depend on Spring. `BeanConfig` does the wiring in infrastructure. |
| `CalculadoraVenta` as a separate POJO | SPEC-BE-003 requires VAT, subtotal and change calculation — SRP: one class, one reason to change. |
| `Dinero` as an immutable Value Object with `menos()` | SPEC-BE-003 operates with monetary additions and subtractions — `menos()` is needed to calculate change. |
| `@Transactional` on the controller, not the service | SPEC-BE-003 requires atomicity. The domain service cannot have Spring annotations. |
| Domain exceptions without Spring dependency | SPEC-BE-005 requires uniform mapping — `GlobalExceptionHandler` in infrastructure does that translation. |
| Separate interfaces per use case (ISP) | `ProductoController` should not depend on sale methods. `LoginUseCase` separate from `LogoutUseCase`. |
| Explicit mapper between JPA entity and domain model | The domain model cannot have JPA annotations — doing so would violate domain independence. |
| `CANTIDAD_INVALIDA` as its own error code | SPEC-BE-003 defines `cantidad <= 0` as a differentiated error case. |
| `idempotencyKey` in `ConfirmarVentaCommand` and `VentaEntity` | SPEC-BE-003: the frontend may retry on timeout — without idempotency, duplicate sales are created. |
| `@Version` on `ProductoEntity` | SPEC-BE-007: two cashiers selling the last stock simultaneously — optimistic locking guarantees consistency. |
| `PageResponse<T>` as a generic Value Object | SPEC-BE-001b and SPEC-BE-006 require pagination — a reusable VO avoids duplicating the logic. |
| `ListarVentasService` separate from `VentaService` | SRP: listing sales is a different responsibility from confirming sales. |
| `AuthService` as a domain POJO | SPEC-BE-008: authentication logic (validate credentials, generate token) is business logic, not infrastructure. |
| `TokenRepository` for JWT blacklist | SPEC-BE-008: logout must invalidate the token on the server to prevent reuse after session close. |
| `AccesoDenegadoException` in domain | SPEC-BE-010, SPEC-BE-011: role-based access control is business logic — the domain throws the exception, the handler maps it to 403. |
| `DevolucionService` separate from `VentaService` | SRP: returning a sale (restore stock, change state) is a different responsibility from confirming it. |
| `ReporteService` separate | SRP: generating reports aggregates historical data — different responsibility from transactional operations. |
| `EstadoVenta` includes `DEVUELTA` | SPEC-BE-009: a returned sale must have a differentiated state to prevent double returns. |
