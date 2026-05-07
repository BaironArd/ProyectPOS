# Implementation Plan — Backend POS
**Version:** 1.3
**References:** requirements.md v1.3 · design.md v1.3
**Methodology:** Spec-Driven Development — each task implements and verifies an API spec

---

## 1. Traceability Principle

A backend task is **complete** when:

1. The code compiles without errors (`mvn clean compile`)
2. Domain logic unit tests pass (`mvn test -pl domain`)
3. Endpoint integration tests confirm the acceptance criteria of the associated spec

The "done" criterion is not subjective: it is defined by the spec.

---

## 2. Technology Stack and Development Environment

### 2.1 Required Tools

| Tool | Version | Purpose |
|---|---|---|
| Java (JDK) | 21 LTS | Runtime and compiler |
| Maven | 3.9.x | Dependency manager and build |
| Spring Boot | 3.2.x | Application framework |
| Spring Data JPA | 3.2.x | Persistence with JPA/Hibernate |
| Spring Security | 6.x | JWT authentication and authorization |
| H2 Database | 2.x | In-memory database (dev/test) |
| PostgreSQL | 15.x | Production database |
| jqwik | 1.8.x | Property-Based Testing |
| JaCoCo | 0.8.x | Code coverage |
| Mockito | 5.x | Mocking in unit tests |

### 2.2 Project Generation

Use [Spring Initializr](https://start.spring.io/) with the following options:

```
Project:      Maven
Language:     Java
Spring Boot:  3.2.x
Group:        com.pos
Artifact:     pos-backend
Java:         21
Dependencies: Spring Web, Spring Data JPA, Spring Security,
              Validation, H2 Database, Lombok (optional)
```

### 2.3 Key dependencies (`pom.xml`)

```xml
<properties>
    <java.version>21</java.version>
</properties>

<dependencies>
    <!-- Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- JPA + H2 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- PostgreSQL (production) -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Security + JWT -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Tests -->
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
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.jacoco</groupId>
            <artifactId>jacoco-maven-plugin</artifactId>
            <version>0.8.11</version>
            <configuration>
                <rules>
                    <rule>
                        <element>PACKAGE</element>
                        <includes>
                            <include>com.pos.domain.*</include>
                        </includes>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.90</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### 2.4 Profile configuration (`application.properties`)

```properties
# Dev profile (H2 in memory)
spring.datasource.url=jdbc:h2:mem:posdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
spring.jpa.hibernate.ddl-auto=create-drop
server.port=8080

# JWT
jwt.secret=secret-key-minimum-256-bits-change-in-production
jwt.expiration=28800
```

### 2.5 Available commands

```bash
# Compile
mvn clean compile

# Run in dev
mvn spring-boot:run

# Unit tests
mvn test

# Tests + JaCoCo coverage
mvn verify

# Production build
mvn clean package -DskipTests
```

### 2.6 "Environment ready" criterion

- [ ] `mvn clean compile` finishes without errors
- [ ] `mvn spring-boot:run` starts the app at `http://localhost:8080`
- [ ] `GET http://localhost:8080/api/v1/productos?q=mo` returns 200 (with data from `data.sql`)
- [ ] `mvn test` runs all tests and reports results
- [ ] `mvn verify` generates coverage report in `target/site/jacoco/`

---

## 3. Task Summary

| ID | Name | Spec(s) | Layer | Estimate | Priority |
|---|---|---|---|---|---|
| T-BE-01 | Project scaffolding | — | Configuration | 1h | High |
| T-BE-02 | Domain model and Value Objects | SPEC-BE-003 | Domain | 3h | High |
| T-BE-03 | Domain exceptions | SPEC-BE-005 | Domain | 1h | High |
| T-BE-04 | Ports (Use Case and Repository interfaces) | All | Domain | 1h | High |
| T-BE-05 | Domain service: CalculadoraVenta | SPEC-BE-003 | Domain | 2h | High |
| T-BE-06 | Domain service: ProductoService | SPEC-BE-001, BE-002 | Domain | 2h | High |
| T-BE-07 | Domain service: VentaService | SPEC-BE-003, BE-004 | Domain | 3h | High |
| T-BE-08 | Outbound adapter: ProductoJpaAdapter | SPEC-BE-001, BE-002 | Infrastructure | 2h | High |
| T-BE-09 | Outbound adapter: VentaJpaAdapter | SPEC-BE-003, BE-004 | Infrastructure | 2h | High |
| T-BE-10 | Inbound adapter: ProductoController | SPEC-BE-001, BE-002 | Infrastructure | 2h | High |
| T-BE-11 | Inbound adapter: VentaController | SPEC-BE-003, BE-004 | Infrastructure | 2h | High |
| T-BE-12 | Global error handler | SPEC-BE-005 | Infrastructure | 1h | High |
| T-BE-13 | Domain unit tests | SPEC-BE-001 to 004 | Tests | 3h | Medium |
| T-BE-14 | Controller integration tests | All | Tests | 4h | Medium |
| T-BE-15 | Initial data (data.sql) and CORS | — | Configuration | 1h | Medium |
| T-BE-16 | Paginated sales history | SPEC-BE-006 | Domain + Infra | 3h | Medium |
| T-BE-17 | Stock concurrency (Optimistic Locking) | SPEC-BE-007 | Infrastructure | 2h | Medium |
| T-BE-18 | Paginated product search | SPEC-BE-001b | Domain + Infra | 2h | Medium |
| T-BE-19 | JWT authentication (Login / Logout) | SPEC-BE-008 | Domain + Infra | 4h | High |
| T-BE-20 | Sale returns | SPEC-BE-009 | Domain + Infra | 3h | High |
| T-BE-21 | Inventory management (Admin) | SPEC-BE-010 | Domain + Infra | 4h | High |
| T-BE-22 | End-of-day reports (Admin) | SPEC-BE-011 | Domain + Infra | 3h | High |

**Total estimate:** ~51 hours of backend development

---

## 4. Detailed Tasks

---

### T-BE-01 — Spring Boot Project Scaffolding

**Description:** Initialize the project with the hexagonal structure and correct dependencies.

**Deliverables:**
- Project generated with Spring Initializr: Spring Web, Spring Data JPA, Validation, H2
- Package structure per `design.md §11` created empty
- `application.properties` configured with H2 in memory for dev
- `pom.xml` with the dependencies from `design.md §12`

**Acceptance criteria:**
- [ ] The project compiles with `mvn clean compile` without errors
- [ ] `mvn spring-boot:run` starts the application on port 8080
- [ ] The package structure exactly reflects the defined hexagonal architecture
- [ ] The `domain/` package contains no imports from `org.springframework` or `jakarta.persistence`

**Prerequisites:** None
**Estimate:** 1h

---

### T-BE-02 — Domain Model and Value Objects

**Description:** Implement the domain entities and value objects. This code cannot have any Spring or JPA annotations.

**Deliverables:**
- `Producto.java` with methods `tieneStock(int)` and `descontarStock(int)`
- `Venta.java` with its fields and constructor
- `ItemVenta.java`
- `Dinero.java` as an immutable `record` with operations: `mas`, `menos`, `por`, `iva`, `esMenorQue`, `toPesos`, `dePesos`
- `ResumenVenta.java` as a `record`
- `EstadoVenta.java` enum: `COMPLETADA`, `CANCELADA`

**Acceptance criteria:**
- [ ] No class in the `domain/model` package has imports from `org.springframework` or `jakarta.persistence`
- [ ] `Dinero.iva()` returns `Math.round(centavos × 0.19)` — verifiable with unit test
- [ ] `Dinero.menos(otro)` returns a new instance with the difference — needed to calculate change in `CalculadoraVenta`
- [ ] `Producto.descontarStock()` throws `StockInsuficienteException` if `cantidad > stock` — verifiable with unit test
- [ ] `Dinero` is immutable: each operation returns a new instance, never modifies `this`

**Prerequisites:** T-BE-01
**Estimate:** 3h

---

### T-BE-03 — Domain Exceptions

**Description:** Create all exceptions defined in `design.md §6`. They are domain classes: they do not depend on Spring or HTTP.

**Deliverables:**
- `StockInsuficienteException.java`
- `MontoInsuficienteException.java`
- `ProductoNotFoundException.java`
- `VentaNotFoundException.java`
- `CarritoVacioException.java`
- `QueryDemasiadoCortaException.java`

Each exception extends `RuntimeException` and receives parameters to build a descriptive message.

**Acceptance criteria:**
- [ ] No exception has Spring or HTTP imports
- [ ] Each exception message mentions the value that caused the error (e.g.: `"Insufficient stock for product id=1. Requested: 5, available: 2."`)
- [ ] They are `RuntimeException` (unchecked) to avoid contaminating domain method signatures
- [ ] Each exception maps to exactly one error code from `requirements.md §3.4`

**Prerequisites:** T-BE-01
**Estimate:** 1h

---

### T-BE-04 — Ports: Use Case and Repository Interfaces

**Description:** Define the interfaces that constitute the contracts between layers. They are the heart of dependency inversion.

**Deliverables:**

Inbound ports (`domain/port/in/`):
- `BuscarProductosUseCase.java`
- `ObtenerProductoUseCase.java`
- `ConfirmarVentaUseCase.java`
- `ObtenerVentaUseCase.java`
- `ConfirmarVentaCommand.java` (record)

Outbound ports (`domain/port/out/`):
- `ProductoRepository.java`
- `VentaRepository.java`

**Acceptance criteria:**
- [ ] No interface has imports outside `java.*` and the `domain` package itself
- [ ] `ConfirmarVentaCommand` is a `record` with fields `items` and `montoPagado`
- [ ] Repository methods use `Optional<T>` where the result can be null
- [ ] Use Cases receive Commands or primitive types — never web layer DTOs
- [ ] `ProductoRepository` includes the `saveAll(List<Producto>)` method required by `VentaService`

**Prerequisites:** T-BE-02, T-BE-03
**Estimate:** 1h

---

### T-BE-05 — Domain Service: CalculadoraVenta

**Description:** Implement the financial calculation logic for the sale. It is a pure domain POJO, verifiable without Spring.

**Deliverables:**
- `CalculadoraVenta.java` (POJO, no Spring annotations) with method `calcular(List<ItemVenta>, Dinero montoPagado): ResumenVenta`

The logic implements exactly the formulas from SPEC-BE-003:

```
subtotal = Σ item.subtotal
iva      = subtotal.iva()          (round(subtotal × 0.19))
total    = subtotal.mas(iva)
cambio   = montoPagado.menos(total)
```

**Acceptance criteria:**
- [ ] `calcular` with empty cart returns `subtotal=0, iva=0, total=0`
- [ ] `calcular` with one item of $100,000 returns `subtotal=100,000, iva=19,000, total=119,000`
- [ ] `calcular` returns negative `cambio` if `montoPagado < total` — validation is done by `VentaService`, not the calculator
- [ ] Values match exactly the numerical examples in SPEC-BE-003
- [ ] The class has no Spring annotations (`@Component`, `@Service`, etc.)

**Prerequisites:** T-BE-02, T-BE-04
**Estimate:** 2h

---

### T-BE-06 — Domain Service: ProductoService

**Specs:** SPEC-BE-001, SPEC-BE-002

**Description:** Implement `ProductoService` as a POJO that implements `BuscarProductosUseCase` and `ObtenerProductoUseCase`. Depends on `ProductoRepository` (interface), never on the JPA adapter.

**Deliverables:**
- `ProductoService.java` (POJO) with constructor injection of `ProductoRepository`
- Method `buscar(String query)`: validates minimum length, delegates to repository
- Method `obtener(Long id)`: throws `ProductoNotFoundException` if not found

**Acceptance criteria:**
- [ ] `buscar(null)` throws `QueryDemasiadoCortaException` (SPEC-BE-001)
- [ ] `buscar("a")` throws `QueryDemasiadoCortaException` (SPEC-BE-001)
- [ ] `buscar("mo")` calls `productoRepository.buscarPorNombre("mo")` without modifying the query
- [ ] `obtener(99L)` throws `ProductoNotFoundException` if the repository returns `Optional.empty()` (SPEC-BE-002)
- [ ] The class has no `@Autowired` or `@Service` — only constructor injection (DIP)

**Prerequisites:** T-BE-03, T-BE-04
**Estimate:** 2h

---

### T-BE-07 — Domain Service: VentaService

**Specs:** SPEC-BE-003, SPEC-BE-004

**Description:** Implement `VentaService` as a POJO. It is the most complex piece of the domain: orchestrates validations, calculation, stock deduction and persistence.

**Deliverables:**
- `VentaService.java` (POJO) with constructor injection of `ProductoRepository`, `VentaRepository`, `CalculadoraVenta`
- Method `confirmar(ConfirmarVentaCommand)` with the complete logic
- Method `obtener(String ventaId)` that throws `VentaNotFoundException`

**Logic of `confirmar`:**
1. Validate that `items` is not empty → `CarritoVacioException`
2. Resolve each product by id → `ProductoNotFoundException` if any is missing
3. Build `List<ItemVenta>` with subtotals
4. Calculate summary with `CalculadoraVenta`
5. Validate that `cambio >= 0` → `MontoInsuficienteException`
6. Deduct stock from each product → `StockInsuficienteException` if insufficient
7. Persist updated products with `saveAll`
8. Create and persist the `Venta` with state `COMPLETADA`
9. Return the created sale

**Acceptance criteria:**
- [ ] `confirmar` with `items=[]` throws `CarritoVacioException` (SPEC-BE-003)
- [ ] `confirmar` with non-existent `productoId` throws `ProductoNotFoundException` (SPEC-BE-003)
- [ ] `confirmar` with `montoPagado < total` throws `MontoInsuficienteException` (SPEC-BE-003)
- [ ] `confirmar` with `cantidad > stock` throws `StockInsuficienteException` (SPEC-BE-003)
- [ ] If any exception is thrown before `saveAll`, `ventaRepository.save()` is **not called** — verifiable with Mockito (SPEC-BE-003)
- [ ] Successful confirmation returns `Venta` with `estado=COMPLETADA` and complete summary (SPEC-BE-003)
- [ ] `obtener(ventaId)` throws `VentaNotFoundException` if not found (SPEC-BE-004)
- [ ] The class has no Spring annotations

**Prerequisites:** T-BE-05, T-BE-06
**Estimate:** 3h

---

### T-BE-08 — Outbound Adapter: ProductoJpaAdapter

**Description:** Implement `ProductoRepository` using Spring Data JPA. This class lives in infrastructure and translates between the domain model and JPA entities.

**Deliverables:**
- `ProductoEntity.java` with `@Entity`, `@Table`, `@Column` annotations
- `ProductoJpaRepository.java` extending `JpaRepository<ProductoEntity, Long>` with method `findByNombreContainingIgnoreCase`
- `ProductoEntityMapper.java` with methods `toDomain(ProductoEntity)` and `toEntity(Producto)`
- `ProductoJpaAdapter.java` with `@Repository`, implementing the domain `ProductoRepository`

**Acceptance criteria:**
- [ ] `ProductoEntity` does not appear in any domain package
- [ ] `buscarPorNombre("mou")` returns products whose name contains "mou" (case-insensitive)
- [ ] The mapper correctly converts `Dinero` ↔ `long` using `Dinero.toPesos()` and `Dinero.dePesos()`
- [ ] `ProductoJpaAdapter` implements all methods of `ProductoRepository` (including `saveAll`)

**Prerequisites:** T-BE-04
**Estimate:** 2h

---

### T-BE-09 — Outbound Adapter: VentaJpaAdapter

**Description:** Implement `VentaRepository` using JPA. Includes the `@OneToMany` relationship between `VentaEntity` and `ItemVentaEntity`.

**Deliverables:**
- `VentaEntity.java` with `@OneToMany(cascade = CascadeType.ALL)` relationship to `ItemVentaEntity`
- `ItemVentaEntity.java`
- `VentaJpaRepository.java`
- `VentaEntityMapper.java`
- `VentaJpaAdapter.java` with `@Repository`, implementing `VentaRepository`

**Acceptance criteria:**
- [ ] `save(venta)` persists the sale with all its items in a single operation
- [ ] `findById(ventaId)` returns `Optional.empty()` if the id does not exist
- [ ] The generated `ventaId` follows the format `VNT-YYYYMMDD-NNN` (SPEC-BE-003)
- [ ] `VentaEntity` does not appear in any domain package

**Prerequisites:** T-BE-04
**Estimate:** 2h

---

### T-BE-10 — Inbound Adapter: ProductoController

**Specs:** SPEC-BE-001, SPEC-BE-002

**Description:** Implement the REST controller for products. Depends only on Use Case interfaces, never on concrete services.

**Deliverables:**
- `ProductoController.java` with endpoints `GET /api/v1/productos?q=` and `GET /api/v1/productos/{id}`
- `ProductoResponse.java` output DTO
- `ProductoMapper.java` (web) that converts `Producto` → `ProductoResponse`
- `ApiResponse.java` generic success response wrapper

**Acceptance criteria:**
- [ ] `GET /api/v1/productos?q=mouse` returns 200 with list (SPEC-BE-001)
- [ ] `GET /api/v1/productos?q=x` returns 400 with `QUERY_DEMASIADO_CORTA` (SPEC-BE-001)
- [ ] `GET /api/v1/productos?q=xyz_nonexistent` returns 200 with `data: []` (SPEC-BE-001)
- [ ] `GET /api/v1/productos/1` returns 200 with the product (SPEC-BE-002)
- [ ] `GET /api/v1/productos/99` returns 404 with `PRODUCTO_NO_ENCONTRADO` (SPEC-BE-002)
- [ ] The response follows exactly the format `{ "data": ..., "timestamp": ... }` (SPEC-BE-005)
- [ ] The `stock` field is present in each product in the response (required by frontend SPEC-002)

**Prerequisites:** T-BE-06, T-BE-08, T-BE-12
**Estimate:** 2h

---

### T-BE-11 — Inbound Adapter: VentaController

**Specs:** SPEC-BE-003, SPEC-BE-004

**Description:** Implement the REST controller for sales with Bean Validation request validation. The `@Transactional` annotation lives here to guarantee atomicity without contaminating the domain.

**Deliverables:**
- `VentaController.java` with endpoints `POST /api/v1/ventas` and `GET /api/v1/ventas/{ventaId}`
- `ConfirmarVentaRequest.java` with `@NotEmpty` on `items`, `@Positive` on `montoPagado` and `@NotBlank` on `idempotencyKey`
- `ItemVentaRequest.java` with `@NotNull` on `productoId` and `@Positive` on `cantidad`
- `VentaResponse.java` complete output DTO with summary
- `VentaMapper.java` (web)

**Acceptance criteria:**
- [ ] `POST /api/v1/ventas` with valid body returns 201 with `ventaId` and complete summary (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` with `items: []` returns 422 with `CARRITO_VACIO` (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` with `montoPagado < total` returns 422 with `VENTA_MONTO_INSUFICIENTE` (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` with non-existent `productoId` returns 404 with `PRODUCTO_NO_ENCONTRADO` (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` with `cantidad > stock` returns 422 with `STOCK_INSUFICIENTE` (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` with `cantidad <= 0` returns 400 with `CANTIDAD_INVALIDA` (SPEC-BE-003)
- [ ] `GET /api/v1/ventas/{id}` returns 200 with the complete sale (SPEC-BE-004)
- [ ] `GET /api/v1/ventas/FAKE_ID` returns 404 with `VENTA_NO_ENCONTRADA` (SPEC-BE-004)
- [ ] The `cambio` field in the confirmation response is the value the frontend shows the cashier (frontend SPEC-006)
- [ ] If `idempotencyKey` was already processed, returns 200 with the existing sale without creating a duplicate (SPEC-BE-003)

**Prerequisites:** T-BE-07, T-BE-09, T-BE-12
**Estimate:** 2h

---

### T-BE-12 — Global Error Handler

**Spec:** SPEC-BE-005

**Description:** Implement `GlobalExceptionHandler` with `@RestControllerAdvice`. Translates domain exceptions to HTTP responses with the uniform error format.

**Deliverables:**
- `GlobalExceptionHandler.java` with handlers for all exceptions in `domain/exception/`
- `ErrorResponse.java` with fields `codigo`, `mensaje`, `timestamp`
- Handler for `MethodArgumentNotValidException` (Bean Validation) → 400 with `VALIDACION_FALLIDA`
- Generic handler for `Exception` → 500 with `ERROR_INTERNO` without stack trace

**Acceptance criteria:**
- [ ] Each domain exception maps to exactly one HTTP status and error code from §3.4 (SPEC-BE-005)
- [ ] The `Exception.class` handler returns 500 with `ERROR_INTERNO` without exposing internal details (SPEC-BE-005)
- [ ] The `timestamp` of the error response is the actual moment of the exception (SPEC-BE-005)
- [ ] The body format is always `{ "error": { "codigo", "mensaje", "timestamp" } }` (SPEC-BE-005)
- [ ] Bean Validation errors return 400 with `VALIDACION_FALLIDA` and the invalid field names
- [ ] The handler covers `QueryDemasiadoCortaException` → 400 with `QUERY_DEMASIADO_CORTA`
- [ ] The handler covers `VentaNotFoundException` → 404 with `VENTA_NO_ENCONTRADA`

**Prerequisites:** T-BE-03
**Estimate:** 1h

---

### T-BE-13 — Domain Unit Tests

**Specs verified:** SPEC-BE-001 to SPEC-BE-004

**Description:** Pure unit tests of the domain layer. No Spring context, no database. Mockito mocks are used for repositories.

**Deliverables:**
- `DineroTest.java`: arithmetic operations (`mas`, `menos`, `por`), `iva()`, immutability
- `CalculadoraVentaTest.java`: empty cart, one item, multiple items, exact change, negative change — **includes property tests with jqwik** (PBT)
- `ProductoServiceTest.java`: valid search, null query, short query, product not found
- `VentaServiceTest.java`: successful confirmation, empty cart, non-existent product, insufficient stock, insufficient amount, atomicity, idempotency (existing key returns previous sale)

**Acceptance criteria:**
- [ ] No test loads Spring context (`@SpringBootTest` forbidden in this suite)
- [ ] Repositories are mocked with Mockito — no real database
- [ ] `VentaServiceTest` verifies that if an exception is thrown before `saveAll`, `ventaRepository.save()` is **not** called (Mockito `verify(..., never())`)
- [ ] Coverage of `domain/service/` ≥ 90% measured with JaCoCo (`mvn verify`)
- [ ] Test values correspond exactly to the numerical examples in the specs
- [ ] `CalculadoraVentaTest` includes at least 3 properties verified with jqwik: correct VAT, total = subtotal + iva, change = montoPagado - total

**Prerequisites:** T-BE-05, T-BE-06, T-BE-07
**Estimate:** 3h

---

### T-BE-14 — Controller Integration Tests

**Specs verified:** All endpoints

**Description:** Integration tests with `@WebMvcTest` that verify the complete HTTP contracts of each spec.

**Deliverables:**
- `ProductoControllerTest.java`: verifies the acceptance criteria of SPEC-BE-001 and SPEC-BE-002
- `VentaControllerTest.java`: verifies the acceptance criteria of SPEC-BE-003 and SPEC-BE-004

**Test structure:**

```java
@WebMvcTest(ProductoController.class)
class ProductoControllerTest {

    @MockBean BuscarProductosUseCase buscarProductos;
    @MockBean ObtenerProductoUseCase obtenerProducto;

    @Test
    void buscar_withValidQuery_returns200WithList() { ... }

    @Test
    void buscar_withShortQuery_returns400WithExpectedCode() { ... }
}
```

**Acceptance criteria:**
- [ ] Each acceptance criterion from SPEC-BE-001 to SPEC-BE-004 has exactly one test that verifies it
- [ ] Tests verify the HTTP status, the error `codigo` and the body structure
- [ ] `MockMvc` is used with `perform().andExpect()` — not `RestTemplate`
- [ ] Error tests verify the body `{ "error": { "codigo": "..." } }` (SPEC-BE-005)
- [ ] `VentaControllerTest` includes a test for `CANTIDAD_INVALIDA` (quantity ≤ 0)

**Prerequisites:** T-BE-10, T-BE-11, T-BE-12
**Estimate:** 4h

---

### T-BE-15 — Initial Data and CORS Configuration

**Description:** Populate the H2 database with test products and enable CORS for the frontend at `localhost:5173`.

**Deliverables:**
- `src/main/resources/data.sql` with at least 10 sample products
- `CorsConfig.java` in `infrastructure/config/` allowing origin `http://localhost:5173`
- `application.properties` with H2 console enabled for dev profile

**Acceptance criteria:**
- [ ] `GET /api/v1/productos?q=mo` returns at least 1 product after starting the application
- [ ] A request from `http://localhost:5173` does not receive a CORS error — aligned with the frontend on Vite (frontend SPEC-001)
- [ ] The H2 console is accessible at `/h2-console` in dev profile

**Prerequisites:** T-BE-08, T-BE-09
**Estimate:** 1h

---

### T-BE-16 — Paginated Sales History (SPEC-BE-006)

**Spec:** SPEC-BE-006

**Description:** Implement the `GET /api/v1/ventas` endpoint with pagination to feed the `SalesHistory` component of the frontend (SPEC-008).

**Deliverables:**
- `ListarVentasUseCase.java` in `domain/port/in/`
- `ListarVentasService.java` (POJO) in `domain/service/`
- `ResumenVentaSimple.java` Value Object in `domain/model/`
- Method `findAll(int page, int size)` in `VentaRepository` and its implementation in `VentaJpaAdapter`
- Endpoint `GET /api/v1/ventas` in `VentaController`
- `VentaResumenResponse.java` output DTO
- `BeanConfig` updated with the new `ListarVentasService` bean

**Acceptance criteria:**
- [ ] `GET /api/v1/ventas?page=0&size=20` returns 200 with paginated list ordered by `fechaHora` descending (SPEC-BE-006)
- [ ] Each item includes `ventaId`, `fechaHora`, `total`, `cantidadItems` and `estado` (SPEC-BE-006)
- [ ] If there are no sales, returns 200 with `items: []` — the frontend shows *"No sales recorded in this shift"* (SPEC-008)
- [ ] The response includes `total`, `page`, `size` and `totalPages` (SPEC-BE-006)
- [ ] `ListarVentasService` is a POJO without Spring annotations

**Prerequisites:** T-BE-04, T-BE-09
**Estimate:** 3h

---

### T-BE-17 — Stock Concurrency with Optimistic Locking (SPEC-BE-007)

**Spec:** SPEC-BE-007

**Description:** Add `@Version` to `ProductoEntity` to detect concurrency conflicts when two simultaneous sales try to deduct the same stock.

**Deliverables:**
- Field `@Version Long version` in `ProductoEntity`
- `ConflictoStockException.java` in `domain/exception/`
- Logic in `ProductoJpaAdapter.saveAll()` that catches JPA's `OptimisticLockException` and converts it to `ConflictoStockException`
- Handler in `GlobalExceptionHandler` for `ConflictoStockException` → 409 with `CONFLICTO_STOCK`

**Acceptance criteria:**
- [ ] `ProductoEntity` has `@Version Long version` — JPA increments it on each `save` (SPEC-BE-007)
- [ ] If `saveAll` throws `OptimisticLockException`, the adapter converts it to `ConflictoStockException` (SPEC-BE-007)
- [ ] `GlobalExceptionHandler` maps `ConflictoStockException` → 409 with `CONFLICTO_STOCK` (SPEC-BE-007)
- [ ] The stock is not modified if the conflict occurs — guaranteed by `@Transactional` (SPEC-BE-007)
- [ ] `ConflictoStockException` has no Spring or JPA imports — it is a pure domain exception

**Prerequisites:** T-BE-08, T-BE-12
**Estimate:** 2h

---

### T-BE-18 — Paginated Product Search (SPEC-BE-001b)

**Spec:** SPEC-BE-001b

**Description:** Extend the `GET /api/v1/productos` endpoint to support optional pagination via `page` and `size` parameters.

**Deliverables:**
- Method `buscarPaginado(String query, int page, int size)` in `ProductoRepository` and its implementation in `ProductoJpaAdapter`
- Update of `BuscarProductosUseCase` or new use case `BuscarProductosPaginadoUseCase`
- Update of `ProductoController` to accept `page` and `size` as optional parameters
- `PageResponse<ProductoResponse>` as return type when pagination parameters are used

**Acceptance criteria:**
- [ ] `GET /api/v1/productos?q=mouse` (without pagination) continues working the same as SPEC-BE-001 — backward compatibility
- [ ] `GET /api/v1/productos?q=mouse&page=0&size=10` returns 200 with `items`, `total`, `page`, `size`, `totalPages` (SPEC-BE-001b)
- [ ] If `size > 100`, returns 400 with `VALIDACION_FALLIDA` (SPEC-BE-001b)
- [ ] If `page >= totalPages`, returns 200 with `items: []` (SPEC-BE-001b)
- [ ] T-BE-14 tests for SPEC-BE-001 continue passing without modification

**Prerequisites:** T-BE-06, T-BE-08, T-BE-10
**Estimate:** 2htorna 200 con `items`, `total`, `page`, `size`, `totalPages` (SPEC-BE-001b)
- [ ] Si `size > 100`, retorna 400 con `VALIDACION_FALLIDA` (SPEC-BE-001b)
- [ ] Si `page >= totalPages`, retorna 200 con `items: []` (SPEC-BE-001b)
- [ ] Los tests de T-BE-14 para SPEC-BE-001 siguen pasando sin modificación

**Dependencias previas:** T-BE-06, T-BE-08, T-BE-10
**Estimación:** 2h

---

## 5. Updated Execution Order

```
T-BE-01 (Scaffolding)
|
+---> T-BE-02 (Models) ---> T-BE-03 (Exceptions) ---> T-BE-04 (Ports)
                                                              |
                              +-------------------------------+
                              |                               |
                         T-BE-05                        T-BE-08 ---> T-BE-10 ---> T-BE-18
                         (Calculator)                   (ProductoJpa)    |
                              |                               |          |
                         T-BE-06                        T-BE-09 ---> T-BE-11
                         (ProductoService)              (VentaJpa)       |
                              |                                          |
                         T-BE-07 <--- T-BE-13 (Unit tests)              |
                         (VentaService)                                  |
                                                    T-BE-12 (ErrorHandler)
                                                         |
                                                    T-BE-14 (Integration tests)

T-BE-15 (CORS + data) -- parallel with T-BE-08/09
T-BE-16 (History) -- after T-BE-04 and T-BE-09
T-BE-17 (Optimistic Locking) -- after T-BE-08 and T-BE-12
T-BE-18 (Paginated search) -- after T-BE-06, T-BE-08 and T-BE-10
T-BE-19 (Auth JWT) -- after T-BE-04 (ports)
T-BE-20 (Returns) -- after T-BE-07 and T-BE-09
T-BE-21 (Admin Inventory) -- after T-BE-06 and T-BE-08
T-BE-22 (Admin Reports) -- after T-BE-09 and T-BE-19
```

---

## 6. Complete Traceability Matrix (updated)

| Spec | Total criteria | Implementation tasks | Test tasks |
|---|---|---|---|
| SPEC-BE-001 | 6 | T-BE-06, T-BE-08, T-BE-10 | T-BE-13, T-BE-14 |
| SPEC-BE-001b | 6 | T-BE-18 | T-BE-14 |
| SPEC-BE-002 | 3 | T-BE-06, T-BE-08, T-BE-10 | T-BE-13, T-BE-14 |
| SPEC-BE-003 | 10 | T-BE-07, T-BE-09, T-BE-11 | T-BE-13, T-BE-14 |
| SPEC-BE-004 | 2 | T-BE-07, T-BE-09, T-BE-11 | T-BE-14 |
| SPEC-BE-005 | 5 | T-BE-03, T-BE-12 | T-BE-14 |
| SPEC-BE-006 | 4 | T-BE-16 | T-BE-14 |
| SPEC-BE-007 | 4 | T-BE-17 | T-BE-13, T-BE-14 |
| SPEC-BE-008 | 6 | T-BE-19 | T-BE-13, T-BE-14 |
| SPEC-BE-009 | 5 | T-BE-20 | T-BE-13, T-BE-14 |
| SPEC-BE-010 | 5 | T-BE-21 | T-BE-14 |
| SPEC-BE-011 | 5 | T-BE-22 | T-BE-14 |
| **Total** | **61** | **22 tasks** | **T-BE-13, T-BE-14** |

> A spec is **complete** when each of its criteria has a test that verifies it and that test passes in CI.

---

## 7. Frontend Alignment (updated)

| Backend task | Dependent frontend task | Shared contract |
|---|---|---|
| T-BE-10 (ProductoController) | T-03 (SearchBar + useSearch) | `GET /api/v1/productos?q=` returns `{ id, nombre, precio, stock }` |
| T-BE-10 (ProductoController) | T-04 (ProductCard) | `stock` field enables/disables "Add" button |
| T-BE-11 (VentaController) | T-08 (confirmarVenta) | `POST /api/v1/ventas` returns `cambio` that the frontend shows the cashier |
| T-BE-12 (GlobalExceptionHandler) | T-09 (ErrorBanner) | Error codes from §3.4 feed `ErrorBanner` messages |
| T-BE-15 (CORS) | T-03 (useSearch) | Without CORS, the frontend at `localhost:5173` cannot call the backend |
| T-BE-16 (ListarVentas) | T-12 (SalesHistory) | `GET /api/v1/ventas` feeds `SalesHistory` (SPEC-008) |
| T-BE-17 (OptimisticLocking) | T-08 (confirmarVenta) | Stock conflict → frontend receives 409 and shows retry message |
| T-BE-18 (PaginatedSearch) | T-03 (useSearch) | Large catalogs require pagination |
| T-BE-19 (Auth JWT) | T-13 (LoginForm) | `POST /api/v1/auth/login` returns JWT token and role |
| T-BE-20 (Returns) | T-14 (RefundPanel) | `POST /api/v1/ventas/{id}/devolucion` processes the return |
| T-BE-21 (Admin Inventory) | T-15 (InventoryPanel) | `GET/POST/PUT /api/v1/admin/productos` manages the catalog |
| T-BE-22 (Admin Reports) | T-16 (ReportsPanel) | `GET /api/v1/reportes/cierre` generates the end-of-day report |

---

### T-BE-19 — JWT Authentication (Login / Logout) — SPEC-BE-008

**Spec:** SPEC-BE-008

**Description:** Implement the JWT authentication system. The domain validates credentials and generates tokens; infrastructure handles blacklist persistence.

**Deliverables:**
- `Usuario.java`, `Rol.java`, `SesionToken.java` in `domain/model/`
- `LoginUseCase.java`, `LogoutUseCase.java` in `domain/port/in/`
- `UsuarioRepository.java`, `TokenRepository.java` in `domain/port/out/`
- `AuthService.java` (POJO) in `domain/service/`
- `UsuarioJpaAdapter.java`, `TokenJpaAdapter.java` in infrastructure
- `UsuarioEntity.java`, `TokenBlacklistEntity.java` with `@Entity`
- `AuthController.java` with `POST /api/v1/auth/login` and `POST /api/v1/auth/logout`
- `LoginRequest.java`, `SesionTokenResponse.java` DTOs
- JWT filter in Spring Security to validate the token on each request
- `BeanConfig` updated with `AuthService`

**Acceptance criteria:**
- [ ] `POST /api/v1/auth/login` with valid credentials returns 200 with JWT, username, role and `expiresIn` (SPEC-BE-008)
- [ ] `POST /api/v1/auth/login` with invalid credentials returns 401 with `CREDENCIALES_INVALIDAS` (SPEC-BE-008)
- [ ] The JWT expires in 8 hours (SPEC-BE-008)
- [ ] `POST /api/v1/auth/logout` invalidates the token and returns 204 (SPEC-BE-008)
- [ ] All endpoints except `/auth/login` return 401 with `TOKEN_INVALIDO` if the token is invalid or expired (SPEC-BE-008)
- [ ] `AuthService` is a POJO without Spring annotations

**Prerequisites:** T-BE-04
**Estimate:** 4h

---

### T-BE-20 — Sale Returns — SPEC-BE-009

**Spec:** SPEC-BE-009

**Description:** Implement the return flow for a completed sale, restoring stock and changing the sale state.

**Deliverables:**
- `Devolucion.java` in `domain/model/`
- `DevolverVentaUseCase.java` in `domain/port/in/`
- `DevolucionService.java` (POJO) in `domain/service/`
- Endpoint `POST /api/v1/ventas/{ventaId}/devolucion` in `VentaController`
- `DevolucionResponse.java` DTO
- `EstadoVenta` updated with value `DEVUELTA`
- `BeanConfig` updated with `DevolucionService`

**Acceptance criteria:**
- [ ] `POST /api/v1/ventas/{id}/devolucion` returns 200 with returned amount and state `DEVUELTA` (SPEC-BE-009)
- [ ] The stock of all products in the sale is restored (SPEC-BE-009)
- [ ] Returns 422 with `VENTA_YA_DEVUELTA` if the sale was already returned (SPEC-BE-009)
- [ ] Returns 422 with `VENTA_NO_DEVOLVIBLE` if the sale is not in state `COMPLETADA` (SPEC-BE-009)
- [ ] The operation is atomic: if stock restoration fails, the sale does not change state (SPEC-BE-009)
- [ ] `DevolucionService` is a POJO without Spring annotations

**Prerequisites:** T-BE-07, T-BE-09
**Estimate:** 3h

---

### T-BE-21 — Inventory Management (Admin) — SPEC-BE-010

**Spec:** SPEC-BE-010

**Description:** Implement the product administration endpoints, accessible only for the ADMIN role.

**Deliverables:**
- `GestionarProductoUseCase.java` in `domain/port/in/`
- `InventarioService.java` (POJO) in `domain/service/`
- `AdminProductoController.java` with `GET/POST /api/v1/admin/productos`, `PUT /api/v1/admin/productos/{id}` and `PATCH /api/v1/admin/productos/{id}/toggle`
- `NuevoProductoRequest.java`, `ActualizarProductoRequest.java` DTOs
- Role guard in the controller: verifies `rol == ADMIN` before executing
- `BeanConfig` updated with `InventarioService`

**Acceptance criteria:**
- [ ] Returns 403 with `ACCESO_DENEGADO` if the role is not `ADMIN` (SPEC-BE-010)
- [ ] `GET /api/v1/admin/productos` returns all products including inactive ones (SPEC-BE-010)
- [ ] `POST` returns 409 with `PRODUCTO_DUPLICADO` if an active product with the same name already exists (SPEC-BE-010)
- [ ] `PATCH /toggle` toggles the `activo` field — an inactive product does not appear in cashier searches (SPEC-BE-010)
- [ ] `PUT` returns 400 with `VALIDACION_FALLIDA` if the price is not positive (SPEC-BE-010)
- [ ] `InventarioService` is a POJO without Spring annotations

**Prerequisites:** T-BE-06, T-BE-08, T-BE-19
**Estimate:** 4h

---

### T-BE-22 — End-of-Day Reports (Admin) — SPEC-BE-011

**Spec:** SPEC-BE-011

**Description:** Implement the end-of-day report endpoint with CSV export support, accessible only for the ADMIN role.

**Deliverables:**
- `ReporteCierre.java`, `VentasPorCajero.java` in `domain/model/`
- `GenerarReporteUseCase.java` in `domain/port/in/`
- `ReporteService.java` (POJO) in `domain/service/`
- Method `generarReporte(fechaDesde, fechaHasta)` in `VentaRepository`
- `ReporteController.java` with `GET /api/v1/reportes/cierre`
- `ReporteCierreResponse.java` DTO
- Support for `Accept: text/csv` on the same endpoint
- `BeanConfig` updated with `ReporteService`

**Acceptance criteria:**
- [ ] Returns 403 with `ACCESO_DENEGADO` if the role is not `ADMIN` (SPEC-BE-011)
- [ ] `montoNeto = montoTotal - montoDevuelto` (SPEC-BE-011)
- [ ] If there are no sales in the range, returns 200 with amounts at 0 and empty arrays (SPEC-BE-011)
- [ ] `fechaDesde` later than `fechaHasta` returns 400 with `VALIDACION_FALLIDA` (SPEC-BE-011)
- [ ] `Accept: text/csv` returns the report in downloadable CSV format (SPEC-BE-011)
- [ ] `ReporteService` is a POJO without Spring annotations

**Prerequisites:** T-BE-09, T-BE-19
**Estimate:** 3h
