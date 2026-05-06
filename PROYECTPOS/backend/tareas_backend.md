# Plan de Tareas — Backend POS
**Versión:** 1.3
**Referencias:** especificaciones_backend.md v1.3 · diseno_backend.md v1.3
**Metodología:** Spec-Driven Development — cada tarea implementa y verifica una spec de API

---

## 1. Principio de trazabilidad

Una tarea de backend está **completa** cuando:

1. El código compila sin errores (`mvn clean compile`)
2. Los tests unitarios de la lógica de dominio pasan (`mvn test -pl domain`)
3. Los tests de integración del endpoint confirman los criterios de aceptación de la spec asociada

El criterio de "terminado" no es subjetivo: está definido por la spec.

---

## 2. Stack tecnológico y entorno de desarrollo

### 2.1 Herramientas requeridas

| Herramienta | Versión | Propósito |
|---|---|---|
| Java (JDK) | 21 LTS | Runtime y compilador |
| Maven | 3.9.x | Gestor de dependencias y build |
| Spring Boot | 3.2.x | Framework de aplicación |
| Spring Data JPA | 3.2.x | Persistencia con JPA/Hibernate |
| Spring Security | 6.x | Autenticación y autorización JWT |
| H2 Database | 2.x | Base de datos en memoria (dev/test) |
| PostgreSQL | 15.x | Base de datos de producción |
| jqwik | 1.8.x | Property-Based Testing |
| JaCoCo | 0.8.x | Cobertura de código |
| Mockito | 5.x | Mocking en tests unitarios |

### 2.2 Generación del proyecto

Usar [Spring Initializr](https://start.spring.io/) con las siguientes opciones:

```
Project:      Maven
Language:     Java
Spring Boot:  3.2.x
Group:        com.pos
Artifact:     pos-backend
Java:         21
Dependencies: Spring Web, Spring Data JPA, Spring Security,
              Validation, H2 Database, Lombok (opcional)
```

### 2.3 Dependencias clave (`pom.xml`)

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

    <!-- PostgreSQL (producción) -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Validación -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Seguridad + JWT -->
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
        <!-- Incluye JUnit 5, Mockito y MockMvc -->
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

### 2.4 Configuración de perfiles (`application.properties`)

```properties
# Perfil dev (H2 en memoria)
spring.datasource.url=jdbc:h2:mem:posdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
spring.jpa.hibernate.ddl-auto=create-drop
server.port=8080

# JWT
jwt.secret=clave-secreta-minimo-256-bits-cambiar-en-produccion
jwt.expiration=28800
```

### 2.5 Comandos disponibles

```bash
# Compilar
mvn clean compile

# Ejecutar en dev
mvn spring-boot:run

# Tests unitarios
mvn test

# Tests + cobertura JaCoCo
mvn verify

# Build para producción
mvn clean package -DskipTests
```

### 2.6 Criterio de "entorno listo"

- [ ] `mvn clean compile` termina sin errores
- [ ] `mvn spring-boot:run` levanta la app en `http://localhost:8080`
- [ ] `GET http://localhost:8080/api/v1/productos?q=mo` retorna 200 (con datos de `data.sql`)
- [ ] `mvn test` ejecuta todos los tests y reporta resultados
- [ ] `mvn verify` genera reporte de cobertura en `target/site/jacoco/`

---

## 3. Resumen de tareas

| ID | Nombre | Spec(s) | Capa | Estimación | Prioridad |
|---|---|---|---|---|---|
| T-BE-01 | Scaffolding del proyecto | — | Configuración | 1h | Alta |
| T-BE-02 | Modelo de dominio y Value Objects | SPEC-BE-003 | Dominio | 3h | Alta |
| T-BE-03 | Excepciones de dominio | SPEC-BE-005 | Dominio | 1h | Alta |
| T-BE-04 | Puertos (interfaces Use Cases y Repositorios) | Todos | Dominio | 1h | Alta |
| T-BE-05 | Servicio de dominio: CalculadoraVenta | SPEC-BE-003 | Dominio | 2h | Alta |
| T-BE-06 | Servicio de dominio: ProductoService | SPEC-BE-001, BE-002 | Dominio | 2h | Alta |
| T-BE-07 | Servicio de dominio: VentaService | SPEC-BE-003, BE-004 | Dominio | 3h | Alta |
| T-BE-08 | Adaptador de salida: ProductoJpaAdapter | SPEC-BE-001, BE-002 | Infraestructura | 2h | Alta |
| T-BE-09 | Adaptador de salida: VentaJpaAdapter | SPEC-BE-003, BE-004 | Infraestructura | 2h | Alta |
| T-BE-10 | Adaptador de entrada: ProductoController | SPEC-BE-001, BE-002 | Infraestructura | 2h | Alta |
| T-BE-11 | Adaptador de entrada: VentaController | SPEC-BE-003, BE-004 | Infraestructura | 2h | Alta |
| T-BE-12 | Manejador global de errores | SPEC-BE-005 | Infraestructura | 1h | Alta |
| T-BE-13 | Tests unitarios de dominio | SPEC-BE-001 al 004 | Tests | 3h | Media |
| T-BE-14 | Tests de integración de controllers | Todos | Tests | 4h | Media |
| T-BE-15 | Datos iniciales (data.sql) y CORS | — | Configuración | 1h | Media |
| T-BE-16 | Historial de ventas paginado | SPEC-BE-006 | Dominio + Infra | 3h | Media |
| T-BE-17 | Concurrencia de stock (Optimistic Locking) | SPEC-BE-007 | Infraestructura | 2h | Media |
| T-BE-18 | Búsqueda paginada de productos | SPEC-BE-001b | Dominio + Infra | 2h | Media |
| T-BE-19 | Autenticación JWT (Login / Logout) | SPEC-BE-008 | Dominio + Infra | 4h | Alta |
| T-BE-20 | Devolución de ventas | SPEC-BE-009 | Dominio + Infra | 3h | Alta |
| T-BE-21 | Gestión de inventario (Admin) | SPEC-BE-010 | Dominio + Infra | 4h | Alta |
| T-BE-22 | Reportes de cierre de caja (Admin) | SPEC-BE-011 | Dominio + Infra | 3h | Alta |

**Total estimado:** ~51 horas de desarrollo backend

---

## 4. Tareas detalladas

---

### T-BE-01 — Scaffolding del proyecto Spring Boot

**Descripción:** Inicializar el proyecto con la estructura hexagonal y las dependencias correctas.

**Entregables:**
- Proyecto generado con Spring Initializr: Spring Web, Spring Data JPA, Validation, H2
- Estructura de paquetes según `diseno_backend.md §11` creada vacía
- `application.properties` configurado con H2 en memoria para dev
- `pom.xml` con las dependencias de `diseno_backend.md §12`

**Criterios de aceptación:**
- [ ] El proyecto compila con `mvn clean compile` sin errores
- [ ] `mvn spring-boot:run` levanta la aplicación en puerto 8080
- [ ] La estructura de paquetes refleja exactamente la arquitectura hexagonal definida
- [ ] El paquete `domain/` no contiene ningún import de `org.springframework` ni de `jakarta.persistence`

**Dependencias previas:** Ninguna
**Estimación:** 1h

---

### T-BE-02 — Modelo de dominio y Value Objects

**Descripción:** Implementar las entidades de dominio y value objects. Este código no puede tener ninguna anotación de Spring ni de JPA.

**Entregables:**
- `Producto.java` con métodos `tieneStock(int)` y `descontarStock(int)`
- `Venta.java` con sus campos y constructor
- `ItemVenta.java`
- `Dinero.java` como `record` inmutable con operaciones: `mas`, `menos`, `por`, `iva`, `esMenorQue`, `toPesos`, `dePesos`
- `ResumenVenta.java` como `record`
- `EstadoVenta.java` enum: `COMPLETADA`, `CANCELADA`

**Criterios de aceptación:**
- [ ] Ninguna clase del paquete `domain/model` tiene imports de `org.springframework` ni de `jakarta.persistence`
- [ ] `Dinero.iva()` retorna `Math.round(centavos × 0.19)` — verificable con test unitario
- [ ] `Dinero.menos(otro)` retorna una nueva instancia con la diferencia — necesario para calcular cambio en `CalculadoraVenta`
- [ ] `Producto.descontarStock()` lanza `StockInsuficienteException` si `cantidad > stock` — verificable con test unitario
- [ ] `Dinero` es inmutable: cada operación retorna una nueva instancia, nunca modifica `this`

**Dependencias previas:** T-BE-01
**Estimación:** 3h

---

### T-BE-03 — Excepciones de dominio

**Descripción:** Crear todas las excepciones definidas en `diseno_backend.md §6`. Son clases del dominio: no dependen de Spring ni de HTTP.

**Entregables:**
- `StockInsuficienteException.java`
- `MontoInsuficienteException.java`
- `ProductoNotFoundException.java`
- `VentaNotFoundException.java`
- `CarritoVacioException.java`
- `QueryDemasiadoCortaException.java`

Cada excepción extiende `RuntimeException` y recibe parámetros para construir un mensaje descriptivo.

**Criterios de aceptación:**
- [ ] Ninguna excepción tiene imports de Spring ni de HTTP
- [ ] El mensaje de cada excepción menciona el valor que causó el error (ej: `"Stock insuficiente para producto id=1. Solicitado: 5, disponible: 2."`)
- [ ] Son `RuntimeException` (unchecked) para no contaminar las firmas de los métodos del dominio
- [ ] Cada excepción mapea a exactamente un código de error de `especificaciones_backend.md §3.4`

**Dependencias previas:** T-BE-01
**Estimación:** 1h

---

### T-BE-04 — Puertos: interfaces de Use Cases y Repositorios

**Descripción:** Definir las interfaces que constituyen los contratos entre capas. Son el corazón de la inversión de dependencias.

**Entregables:**

Puertos de entrada (`domain/port/in/`):
- `BuscarProductosUseCase.java`
- `ObtenerProductoUseCase.java`
- `ConfirmarVentaUseCase.java`
- `ObtenerVentaUseCase.java`
- `ConfirmarVentaCommand.java` (record)

Puertos de salida (`domain/port/out/`):
- `ProductoRepository.java`
- `VentaRepository.java`

**Criterios de aceptación:**
- [ ] Ninguna interfaz tiene imports fuera de `java.*` y del propio paquete `domain`
- [ ] `ConfirmarVentaCommand` es un `record` con campos `items` y `montoPagado`
- [ ] Los métodos de los repositorios usan `Optional<T>` donde el resultado puede ser nulo
- [ ] Los Use Cases reciben Commands o tipos primitivos — nunca DTOs de la capa web
- [ ] `ProductoRepository` incluye el método `saveAll(List<Producto>)` requerido por `VentaService`

**Dependencias previas:** T-BE-02, T-BE-03
**Estimación:** 1h

---

### T-BE-05 — Servicio de dominio: CalculadoraVenta

**Descripción:** Implementar la lógica de cálculo financiero de la venta. Es un POJO puro del dominio, verificable sin Spring.

**Entregables:**
- `CalculadoraVenta.java` (POJO, sin anotaciones de Spring) con método `calcular(List<ItemVenta>, Dinero montoPagado): ResumenVenta`

La lógica implementa exactamente las fórmulas de SPEC-BE-003:

```
subtotal = Σ item.subtotal
iva      = subtotal.iva()          (round(subtotal × 0.19))
total    = subtotal.mas(iva)
cambio   = montoPagado.menos(total)
```

**Criterios de aceptación:**
- [ ] `calcular` con carrito vacío retorna `subtotal=0, iva=0, total=0`
- [ ] `calcular` con un ítem de $100.000 retorna `subtotal=100.000, iva=19.000, total=119.000`
- [ ] `calcular` retorna `cambio` negativo si `montoPagado < total` — la validación la hace `VentaService`, no la calculadora
- [ ] Los valores coinciden exactamente con los ejemplos numéricos de SPEC-BE-003
- [ ] La clase no tiene ninguna anotación de Spring (`@Component`, `@Service`, etc.)

**Dependencias previas:** T-BE-02, T-BE-04
**Estimación:** 2h

---

### T-BE-06 — Servicio de dominio: ProductoService

**Specs:** SPEC-BE-001, SPEC-BE-002

**Descripción:** Implementar `ProductoService` como POJO que implementa `BuscarProductosUseCase` y `ObtenerProductoUseCase`. Depende de `ProductoRepository` (interfaz), nunca del adaptador JPA.

**Entregables:**
- `ProductoService.java` (POJO) con inyección por constructor de `ProductoRepository`
- Método `buscar(String query)`: valida longitud mínima, delega al repositorio
- Método `obtener(Long id)`: lanza `ProductoNotFoundException` si no existe

**Criterios de aceptación:**
- [ ] `buscar(null)` lanza `QueryDemasiadoCortaException` (SPEC-BE-001)
- [ ] `buscar("a")` lanza `QueryDemasiadoCortaException` (SPEC-BE-001)
- [ ] `buscar("mo")` llama a `productoRepository.buscarPorNombre("mo")` sin modificar la query
- [ ] `obtener(99L)` lanza `ProductoNotFoundException` si el repositorio retorna `Optional.empty()` (SPEC-BE-002)
- [ ] La clase no tiene `@Autowired` ni `@Service` — solo inyección por constructor (DIP)

**Dependencias previas:** T-BE-03, T-BE-04
**Estimación:** 2h

---

### T-BE-07 — Servicio de dominio: VentaService

**Specs:** SPEC-BE-003, SPEC-BE-004

**Descripción:** Implementar `VentaService` como POJO. Es la pieza más compleja del dominio: orquesta validaciones, cálculo, descuento de stock y persistencia.

**Entregables:**
- `VentaService.java` (POJO) con inyección por constructor de `ProductoRepository`, `VentaRepository`, `CalculadoraVenta`
- Método `confirmar(ConfirmarVentaCommand)` con la lógica completa
- Método `obtener(String ventaId)` que lanza `VentaNotFoundException`

**Lógica de `confirmar`:**
1. Validar que `items` no esté vacío → `CarritoVacioException`
2. Resolver cada producto por id → `ProductoNotFoundException` si alguno falta
3. Construir `List<ItemVenta>` con subtotales
4. Calcular resumen con `CalculadoraVenta`
5. Validar que `cambio >= 0` → `MontoInsuficienteException`
6. Descontar stock de cada producto → `StockInsuficienteException` si no hay suficiente
7. Persistir productos actualizados con `saveAll`
8. Crear y persistir la `Venta` con estado `COMPLETADA`
9. Retornar la venta creada

**Criterios de aceptación:**
- [ ] `confirmar` con `items=[]` lanza `CarritoVacioException` (SPEC-BE-003)
- [ ] `confirmar` con `productoId` inexistente lanza `ProductoNotFoundException` (SPEC-BE-003)
- [ ] `confirmar` con `montoPagado < total` lanza `MontoInsuficienteException` (SPEC-BE-003)
- [ ] `confirmar` con `cantidad > stock` lanza `StockInsuficienteException` (SPEC-BE-003)
- [ ] Si lanza cualquier excepción antes del `saveAll`, `ventaRepository.save()` **no es llamado** — verificable con Mockito (SPEC-BE-003)
- [ ] Confirmación exitosa retorna `Venta` con `estado=COMPLETADA` y resumen completo (SPEC-BE-003)
- [ ] `obtener(ventaId)` lanza `VentaNotFoundException` si no existe (SPEC-BE-004)
- [ ] La clase no tiene anotaciones de Spring

**Dependencias previas:** T-BE-05, T-BE-06
**Estimación:** 3h

---

### T-BE-08 — Adaptador de salida: ProductoJpaAdapter

**Descripción:** Implementar `ProductoRepository` usando Spring Data JPA. Esta clase vive en infraestructura y traduce entre el modelo de dominio y las entidades JPA.

**Entregables:**
- `ProductoEntity.java` con anotaciones `@Entity`, `@Table`, `@Column`
- `ProductoJpaRepository.java` extendiendo `JpaRepository<ProductoEntity, Long>` con método `findByNombreContainingIgnoreCase`
- `ProductoEntityMapper.java` con métodos `toDomain(ProductoEntity)` y `toEntity(Producto)`
- `ProductoJpaAdapter.java` con `@Repository`, implementando `ProductoRepository` del dominio

**Criterios de aceptación:**
- [ ] `ProductoEntity` no aparece en ningún paquete del dominio
- [ ] `buscarPorNombre("mou")` retorna productos cuyo nombre contiene "mou" (case-insensitive)
- [ ] El mapper convierte correctamente `Dinero` ↔ `long` usando `Dinero.toPesos()` y `Dinero.dePesos()`
- [ ] `ProductoJpaAdapter` implementa todos los métodos de `ProductoRepository` (incluyendo `saveAll`)

**Dependencias previas:** T-BE-04
**Estimación:** 2h

---

### T-BE-09 — Adaptador de salida: VentaJpaAdapter

**Descripción:** Implementar `VentaRepository` usando JPA. Incluye la relación `@OneToMany` entre `VentaEntity` e `ItemVentaEntity`.

**Entregables:**
- `VentaEntity.java` con relación `@OneToMany(cascade = CascadeType.ALL)` a `ItemVentaEntity`
- `ItemVentaEntity.java`
- `VentaJpaRepository.java`
- `VentaEntityMapper.java`
- `VentaJpaAdapter.java` con `@Repository`, implementando `VentaRepository`

**Criterios de aceptación:**
- [ ] `save(venta)` persiste la venta con todos sus ítems en una sola operación
- [ ] `findById(ventaId)` retorna `Optional.empty()` si el id no existe
- [ ] El `ventaId` generado sigue el formato `VNT-YYYYMMDD-NNN` (SPEC-BE-003)
- [ ] `VentaEntity` no aparece en ningún paquete del dominio

**Dependencias previas:** T-BE-04
**Estimación:** 2h

---

### T-BE-10 — Adaptador de entrada: ProductoController

**Specs:** SPEC-BE-001, SPEC-BE-002

**Descripción:** Implementar el controller REST para productos. Depende únicamente de las interfaces de Use Cases, nunca de los servicios concretos.

**Entregables:**
- `ProductoController.java` con endpoints `GET /api/v1/productos?q=` y `GET /api/v1/productos/{id}`
- `ProductoResponse.java` DTO de salida
- `ProductoMapper.java` (web) que convierte `Producto` → `ProductoResponse`
- `ApiResponse.java` wrapper genérico de respuesta exitosa

**Criterios de aceptación:**
- [ ] `GET /api/v1/productos?q=mouse` retorna 200 con lista (SPEC-BE-001)
- [ ] `GET /api/v1/productos?q=x` retorna 400 con `QUERY_DEMASIADO_CORTA` (SPEC-BE-001)
- [ ] `GET /api/v1/productos?q=xyz_inexistente` retorna 200 con `data: []` (SPEC-BE-001)
- [ ] `GET /api/v1/productos/1` retorna 200 con el producto (SPEC-BE-002)
- [ ] `GET /api/v1/productos/99` retorna 404 con `PRODUCTO_NO_ENCONTRADO` (SPEC-BE-002)
- [ ] La respuesta sigue exactamente el formato `{ "data": ..., "timestamp": ... }` (SPEC-BE-005)
- [ ] El campo `stock` está presente en cada producto de la respuesta (requerido por SPEC-002 del frontend)

**Dependencias previas:** T-BE-06, T-BE-08, T-BE-12
**Estimación:** 2h

---

### T-BE-11 — Adaptador de entrada: VentaController

**Specs:** SPEC-BE-003, SPEC-BE-004

**Descripción:** Implementar el controller REST para ventas con validación de request con Bean Validation. La anotación `@Transactional` vive aquí para garantizar atomicidad sin contaminar el dominio.

**Entregables:**
- `VentaController.java` con endpoints `POST /api/v1/ventas` y `GET /api/v1/ventas/{ventaId}`
- `ConfirmarVentaRequest.java` con `@NotEmpty` en `items`, `@Positive` en `montoPagado` y `@NotBlank` en `idempotencyKey`
- `ItemVentaRequest.java` con `@NotNull` en `productoId` y `@Positive` en `cantidad`
- `VentaResponse.java` DTO de salida completo con resumen
- `VentaMapper.java` (web)

**Criterios de aceptación:**
- [ ] `POST /api/v1/ventas` con body válido retorna 201 con `ventaId` y resumen completo (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` con `items: []` retorna 422 con `CARRITO_VACIO` (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` con `montoPagado < total` retorna 422 con `VENTA_MONTO_INSUFICIENTE` (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` con `productoId` inexistente retorna 404 con `PRODUCTO_NO_ENCONTRADO` (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` con `cantidad > stock` retorna 422 con `STOCK_INSUFICIENTE` (SPEC-BE-003)
- [ ] `POST /api/v1/ventas` con `cantidad <= 0` retorna 400 con `CANTIDAD_INVALIDA` (SPEC-BE-003)
- [ ] `GET /api/v1/ventas/{id}` retorna 200 con la venta completa (SPEC-BE-004)
- [ ] `GET /api/v1/ventas/ID_FALSO` retorna 404 con `VENTA_NO_ENCONTRADA` (SPEC-BE-004)
- [ ] El campo `cambio` en la respuesta de confirmación es el valor que el frontend muestra al cajero (SPEC-006 frontend)
- [ ] Si `idempotencyKey` ya fue procesado, retorna 200 con la venta existente sin crear duplicado (SPEC-BE-003)

**Dependencias previas:** T-BE-07, T-BE-09, T-BE-12
**Estimación:** 2h

---

### T-BE-12 — Manejador global de errores

**Spec:** SPEC-BE-005

**Descripción:** Implementar `GlobalExceptionHandler` con `@RestControllerAdvice`. Traduce excepciones de dominio a respuestas HTTP con el formato uniforme de error.

**Entregables:**
- `GlobalExceptionHandler.java` con handlers para todas las excepciones de `domain/exception/`
- `ErrorResponse.java` con campos `codigo`, `mensaje`, `timestamp`
- Handler para `MethodArgumentNotValidException` (Bean Validation) → 400 con `VALIDACION_FALLIDA`
- Handler genérico para `Exception` → 500 con `ERROR_INTERNO` sin stack trace

**Criterios de aceptación:**
- [ ] Cada excepción de dominio mapea a exactamente un HTTP status y código de error de §3.4 (SPEC-BE-005)
- [ ] El handler de `Exception.class` retorna 500 con `ERROR_INTERNO` sin exponer detalles internos (SPEC-BE-005)
- [ ] El `timestamp` de la respuesta de error es el momento real de la excepción (SPEC-BE-005)
- [ ] El formato del body es siempre `{ "error": { "codigo", "mensaje", "timestamp" } }` (SPEC-BE-005)
- [ ] Errores de Bean Validation retornan 400 con `VALIDACION_FALLIDA` y los nombres de campo inválidos
- [ ] El handler cubre `QueryDemasiadoCortaException` → 400 con `QUERY_DEMASIADO_CORTA`
- [ ] El handler cubre `VentaNotFoundException` → 404 con `VENTA_NO_ENCONTRADA`

**Dependencias previas:** T-BE-03
**Estimación:** 1h

---

### T-BE-13 — Tests unitarios de dominio

**Specs verificadas:** SPEC-BE-001 al SPEC-BE-004

**Descripción:** Tests unitarios puros de la capa de dominio. Sin Spring context, sin base de datos. Se usan Mocks (Mockito) para los repositorios.

**Entregables:**
- `DineroTest.java`: operaciones aritméticas (`mas`, `menos`, `por`), `iva()`, inmutabilidad
- `CalculadoraVentaTest.java`: carrito vacío, un ítem, múltiples ítems, cambio exacto, cambio negativo — **incluye tests de propiedades con jqwik** (PBT)
- `ProductoServiceTest.java`: búsqueda válida, query nula, query corta, producto no encontrado
- `VentaServiceTest.java`: confirmación exitosa, carrito vacío, producto inexistente, stock insuficiente, monto insuficiente, atomicidad, idempotencia (clave existente retorna venta previa)

**Criterios de aceptación:**
- [ ] Ningún test levanta Spring context (`@SpringBootTest` prohibido en esta suite)
- [ ] Los repositorios se mockean con Mockito — sin base de datos real
- [ ] `VentaServiceTest` verifica que si lanza excepción antes del `saveAll`, `ventaRepository.save()` **no** es llamado (Mockito `verify(..., never())`)
- [ ] Cobertura de `domain/service/` ≥ 90% medida con JaCoCo (`mvn verify`)
- [ ] Los valores de los tests corresponden exactamente a los ejemplos numéricos de las specs
- [ ] `CalculadoraVentaTest` incluye al menos 3 propiedades verificadas con jqwik: IVA correcto, total = subtotal + iva, cambio = montoPagado - total

**Dependencias previas:** T-BE-05, T-BE-06, T-BE-07
**Estimación:** 3h

---

### T-BE-14 — Tests de integración de controllers

**Specs verificadas:** Todos los endpoints

**Descripción:** Tests de integración con `@WebMvcTest` que verifican los contratos HTTP completos de cada spec.

**Entregables:**
- `ProductoControllerTest.java`: verifica los criterios de aceptación de SPEC-BE-001 y SPEC-BE-002
- `VentaControllerTest.java`: verifica los criterios de aceptación de SPEC-BE-003 y SPEC-BE-004

**Estructura de cada test:**

```java
@WebMvcTest(ProductoController.class)
class ProductoControllerTest {

    @MockBean BuscarProductosUseCase buscarProductos;
    @MockBean ObtenerProductoUseCase obtenerProducto;

    @Test
    void buscar_conQueryValida_retorna200ConLista() { ... }

    @Test
    void buscar_conQueryCorta_retorna400ConCodigoEsperado() { ... }
}
```

**Criterios de aceptación:**
- [ ] Cada criterio de aceptación de SPEC-BE-001 a SPEC-BE-004 tiene exactamente un test que lo verifica
- [ ] Los tests verifican el HTTP status, el `codigo` de error y la estructura del body
- [ ] Se usa `MockMvc` con `perform().andExpect()` — no `RestTemplate`
- [ ] Los tests de error verifican el body `{ "error": { "codigo": "..." } }` (SPEC-BE-005)
- [ ] `VentaControllerTest` incluye un test para `CANTIDAD_INVALIDA` (cantidad ≤ 0)

**Dependencias previas:** T-BE-10, T-BE-11, T-BE-12
**Estimación:** 4h

---

### T-BE-15 — Datos iniciales y configuración CORS

**Descripción:** Poblar la base de datos H2 con productos de prueba y habilitar CORS para el frontend en `localhost:5173`.

**Entregables:**
- `src/main/resources/data.sql` con al menos 10 productos de ejemplo
- `CorsConfig.java` en `infrastructure/config/` permitiendo origen `http://localhost:5173`
- `application.properties` con H2 console habilitada para perfil dev

**Criterios de aceptación:**
- [ ] `GET /api/v1/productos?q=mo` retorna al menos 1 producto tras levantar la aplicación
- [ ] Una petición desde `http://localhost:5173` no recibe error de CORS — alineado con el frontend en Vite (SPEC-001 frontend)
- [ ] La H2 console es accesible en `/h2-console` en perfil dev

**Dependencias previas:** T-BE-08, T-BE-09
**Estimación:** 1h

---

### T-BE-16 — Historial de ventas paginado (SPEC-BE-006)

**Spec:** SPEC-BE-006

**Descripción:** Implementar el endpoint `GET /api/v1/ventas` con paginación para alimentar el componente `SalesHistory` del frontend (SPEC-008).

**Entregables:**
- `ListarVentasUseCase.java` en `domain/port/in/`
- `ListarVentasService.java` (POJO) en `domain/service/`
- `ResumenVentaSimple.java` Value Object en `domain/model/`
- Método `findAll(int page, int size)` en `VentaRepository` y su implementación en `VentaJpaAdapter`
- Endpoint `GET /api/v1/ventas` en `VentaController`
- `VentaResumenResponse.java` DTO de salida
- `BeanConfig` actualizado con el nuevo bean `ListarVentasService`

**Criterios de aceptación:**
- [ ] `GET /api/v1/ventas?page=0&size=20` retorna 200 con lista paginada ordenada por `fechaHora` descendente (SPEC-BE-006)
- [ ] Cada ítem incluye `ventaId`, `fechaHora`, `total`, `cantidadItems` y `estado` (SPEC-BE-006)
- [ ] Si no hay ventas, retorna 200 con `items: []` — el frontend muestra *"No hay ventas registradas en este turno"* (SPEC-008)
- [ ] La respuesta incluye `total`, `page`, `size` y `totalPages` (SPEC-BE-006)
- [ ] `ListarVentasService` es un POJO sin anotaciones de Spring

**Dependencias previas:** T-BE-04, T-BE-09
**Estimación:** 3h

---

### T-BE-17 — Concurrencia de stock con Optimistic Locking (SPEC-BE-007)

**Spec:** SPEC-BE-007

**Descripción:** Agregar `@Version` a `ProductoEntity` para detectar conflictos de concurrencia cuando dos ventas simultáneas intentan descontar el mismo stock.

**Entregables:**
- Campo `@Version Long version` en `ProductoEntity`
- `ConflictoStockException.java` en `domain/exception/`
- Lógica en `ProductoJpaAdapter.saveAll()` que captura `OptimisticLockException` de JPA y la convierte en `ConflictoStockException`
- Handler en `GlobalExceptionHandler` para `ConflictoStockException` → 409 con `CONFLICTO_STOCK`

**Criterios de aceptación:**
- [ ] `ProductoEntity` tiene `@Version Long version` — JPA lo incrementa en cada `save` (SPEC-BE-007)
- [ ] Si `saveAll` lanza `OptimisticLockException`, el adaptador la convierte en `ConflictoStockException` (SPEC-BE-007)
- [ ] `GlobalExceptionHandler` mapea `ConflictoStockException` → 409 con `CONFLICTO_STOCK` (SPEC-BE-007)
- [ ] El stock no queda modificado si ocurre el conflicto — garantizado por `@Transactional` (SPEC-BE-007)
- [ ] `ConflictoStockException` no tiene imports de Spring ni de JPA — es una excepción de dominio pura

**Dependencias previas:** T-BE-08, T-BE-12
**Estimación:** 2h

---

### T-BE-18 — Búsqueda paginada de productos (SPEC-BE-001b)

**Spec:** SPEC-BE-001b

**Descripción:** Extender el endpoint `GET /api/v1/productos` para soportar paginación opcional mediante parámetros `page` y `size`.

**Entregables:**
- Método `buscarPaginado(String query, int page, int size)` en `ProductoRepository` y su implementación en `ProductoJpaAdapter`
- Actualización de `BuscarProductosUseCase` o nuevo use case `BuscarProductosPaginadoUseCase`
- Actualización de `ProductoController` para aceptar `page` y `size` como parámetros opcionales
- `PageResponse<ProductoResponse>` como tipo de retorno cuando se usan parámetros de paginación

**Criterios de aceptación:**
- [ ] `GET /api/v1/productos?q=mouse` (sin paginación) sigue funcionando igual que SPEC-BE-001 — compatibilidad hacia atrás
- [ ] `GET /api/v1/productos?q=mouse&page=0&size=10` retorna 200 con `items`, `total`, `page`, `size`, `totalPages` (SPEC-BE-001b)
- [ ] Si `size > 100`, retorna 400 con `VALIDACION_FALLIDA` (SPEC-BE-001b)
- [ ] Si `page >= totalPages`, retorna 200 con `items: []` (SPEC-BE-001b)
- [ ] Los tests de T-BE-14 para SPEC-BE-001 siguen pasando sin modificación

**Dependencias previas:** T-BE-06, T-BE-08, T-BE-10
**Estimación:** 2h

---

## 5. Orden de ejecución actualizado

```
T-BE-01 (Scaffolding)
|
+---> T-BE-02 (Modelos) ---> T-BE-03 (Excepciones) ---> T-BE-04 (Puertos)
                                                              |
                              +-------------------------------+
                              |                               |
                         T-BE-05                        T-BE-08 ---> T-BE-10 ---> T-BE-18
                         (Calculadora)                  (ProductoJpa)    |
                              |                               |          |
                         T-BE-06                        T-BE-09 ---> T-BE-11
                         (ProductoService)              (VentaJpa)       |
                              |                                          |
                         T-BE-07 <--- T-BE-13 (Tests unitarios)         |
                         (VentaService)                                  |
                                                    T-BE-12 (ErrorHandler)
                                                         |
                                                    T-BE-14 (Tests integración)

T-BE-15 (CORS + datos) -- paralelo con T-BE-08/09
T-BE-16 (Historial) -- después de T-BE-04 y T-BE-09
T-BE-17 (Optimistic Locking) -- después de T-BE-08 y T-BE-12
T-BE-18 (Paginación búsqueda) -- después de T-BE-06, T-BE-08 y T-BE-10
T-BE-19 (Auth JWT) -- después de T-BE-04 (puertos)
T-BE-20 (Devoluciones) -- después de T-BE-07 y T-BE-09
T-BE-21 (Inventario Admin) -- después de T-BE-06 y T-BE-08
T-BE-22 (Reportes Admin) -- después de T-BE-09 y T-BE-19
```

---

## 6. Matriz de trazabilidad completa (actualizada)

| Spec | Criterios totales | Tareas de implementación | Tareas de test |
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
| **Total** | **61** | **22 tareas** | **T-BE-13, T-BE-14** |

> Una spec está **completa** cuando cada uno de sus criterios tiene un test que lo verifica y ese test pasa en CI.

---

## 7. Alineación con el frontend (actualizada)

| Tarea backend | Tarea frontend dependiente | Contrato compartido |
|---|---|---|
| T-BE-10 (ProductoController) | T-03 (SearchBar + useSearch) | `GET /api/v1/productos?q=` retorna `{ id, nombre, precio, stock }` |
| T-BE-10 (ProductoController) | T-04 (ProductCard) | Campo `stock` activa/desactiva botón "Agregar" |
| T-BE-11 (VentaController) | T-08 (confirmarVenta) | `POST /api/v1/ventas` retorna `cambio` que el frontend muestra al cajero |
| T-BE-12 (GlobalExceptionHandler) | T-09 (ErrorBanner) | Códigos de error de §3.4 alimentan mensajes del `ErrorBanner` |
| T-BE-15 (CORS) | T-03 (useSearch) | Sin CORS, el frontend en `localhost:5173` no puede llamar al backend |
| T-BE-16 (ListarVentas) | T-12 (SalesHistory) | `GET /api/v1/ventas` alimenta `SalesHistory` (SPEC-008) |
| T-BE-17 (OptimisticLocking) | T-08 (confirmarVenta) | Conflicto de stock → frontend recibe 409 y muestra mensaje de reintento |
| T-BE-18 (PaginaciónBúsqueda) | T-03 (useSearch) | Catálogos grandes requieren paginación |
| T-BE-19 (Auth JWT) | T-13 (LoginForm) | `POST /api/v1/auth/login` retorna token JWT y rol |
| T-BE-20 (Devoluciones) | T-14 (RefundPanel) | `POST /api/v1/ventas/{id}/devolucion` procesa la devolución |
| T-BE-21 (Inventario Admin) | T-15 (InventoryPanel) | `GET/POST/PUT /api/v1/admin/productos` gestiona el catálogo |
| T-BE-22 (Reportes Admin) | T-16 (ReportsPanel) | `GET /api/v1/reportes/cierre` genera el reporte de caja |

---

### T-BE-19 — Autenticación JWT (Login / Logout) — SPEC-BE-008

**Spec:** SPEC-BE-008

**Descripción:** Implementar el sistema de autenticación con JWT. El dominio valida credenciales y genera tokens; la infraestructura maneja la persistencia de la blacklist.

**Entregables:**
- `Usuario.java`, `Rol.java`, `SesionToken.java` en `domain/model/`
- `LoginUseCase.java`, `LogoutUseCase.java` en `domain/port/in/`
- `UsuarioRepository.java`, `TokenRepository.java` en `domain/port/out/`
- `AuthService.java` (POJO) en `domain/service/`
- `UsuarioJpaAdapter.java`, `TokenJpaAdapter.java` en infraestructura
- `UsuarioEntity.java`, `TokenBlacklistEntity.java` con `@Entity`
- `AuthController.java` con `POST /api/v1/auth/login` y `POST /api/v1/auth/logout`
- `LoginRequest.java`, `SesionTokenResponse.java` DTOs
- Filtro JWT en Spring Security para validar el token en cada petición
- `BeanConfig` actualizado con `AuthService`

**Criterios de aceptación:**
- [ ] `POST /api/v1/auth/login` con credenciales válidas retorna 200 con JWT, usuario, rol y `expiresIn` (SPEC-BE-008)
- [ ] `POST /api/v1/auth/login` con credenciales inválidas retorna 401 con `CREDENCIALES_INVALIDAS` (SPEC-BE-008)
- [ ] El JWT expira en 8 horas (SPEC-BE-008)
- [ ] `POST /api/v1/auth/logout` invalida el token y retorna 204 (SPEC-BE-008)
- [ ] Todos los endpoints excepto `/auth/login` retornan 401 con `TOKEN_INVALIDO` si el token es inválido o expirado (SPEC-BE-008)
- [ ] `AuthService` es un POJO sin anotaciones de Spring

**Dependencias previas:** T-BE-04
**Estimación:** 4h

---

### T-BE-20 — Devolución de ventas — SPEC-BE-009

**Spec:** SPEC-BE-009

**Descripción:** Implementar el flujo de devolución de una venta completada, restaurando el stock y cambiando el estado de la venta.

**Entregables:**
- `Devolucion.java` en `domain/model/`
- `DevolverVentaUseCase.java` en `domain/port/in/`
- `DevolucionService.java` (POJO) en `domain/service/`
- Endpoint `POST /api/v1/ventas/{ventaId}/devolucion` en `VentaController`
- `DevolucionResponse.java` DTO
- `EstadoVenta` actualizado con valor `DEVUELTA`
- `BeanConfig` actualizado con `DevolucionService`

**Criterios de aceptación:**
- [ ] `POST /api/v1/ventas/{id}/devolucion` retorna 200 con monto devuelto y estado `DEVUELTA` (SPEC-BE-009)
- [ ] El stock de todos los productos de la venta se restaura (SPEC-BE-009)
- [ ] Retorna 422 con `VENTA_YA_DEVUELTA` si la venta ya fue devuelta (SPEC-BE-009)
- [ ] Retorna 422 con `VENTA_NO_DEVOLVIBLE` si la venta no está en estado `COMPLETADA` (SPEC-BE-009)
- [ ] La operación es atómica: si falla la restauración de stock, la venta no cambia de estado (SPEC-BE-009)
- [ ] `DevolucionService` es un POJO sin anotaciones de Spring

**Dependencias previas:** T-BE-07, T-BE-09
**Estimación:** 3h

---

### T-BE-21 — Gestión de inventario (Admin) — SPEC-BE-010

**Spec:** SPEC-BE-010

**Descripción:** Implementar los endpoints de administración de productos, accesibles solo para el rol ADMIN.

**Entregables:**
- `GestionarProductoUseCase.java` en `domain/port/in/`
- `InventarioService.java` (POJO) en `domain/service/`
- `AdminProductoController.java` con `GET/POST /api/v1/admin/productos` y `PUT /api/v1/admin/productos/{id}` y `PATCH /api/v1/admin/productos/{id}/toggle`
- `NuevoProductoRequest.java`, `ActualizarProductoRequest.java` DTOs
- Guard de rol en el controller: verifica `rol == ADMIN` antes de ejecutar
- `BeanConfig` actualizado con `InventarioService`

**Criterios de aceptación:**
- [ ] Retorna 403 con `ACCESO_DENEGADO` si el rol no es `ADMIN` (SPEC-BE-010)
- [ ] `GET /api/v1/admin/productos` retorna todos los productos incluyendo inactivos (SPEC-BE-010)
- [ ] `POST` retorna 409 con `PRODUCTO_DUPLICADO` si ya existe un producto activo con el mismo nombre (SPEC-BE-010)
- [ ] `PATCH /toggle` alterna el campo `activo` — un producto inactivo no aparece en búsquedas de cajero (SPEC-BE-010)
- [ ] `PUT` retorna 400 con `VALIDACION_FALLIDA` si el precio no es positivo (SPEC-BE-010)
- [ ] `InventarioService` es un POJO sin anotaciones de Spring

**Dependencias previas:** T-BE-06, T-BE-08, T-BE-19
**Estimación:** 4h

---

### T-BE-22 — Reportes de cierre de caja (Admin) — SPEC-BE-011

**Spec:** SPEC-BE-011

**Descripción:** Implementar el endpoint de reportes de cierre de caja con soporte para exportación CSV, accesible solo para el rol ADMIN.

**Entregables:**
- `ReporteCierre.java`, `VentasPorCajero.java` en `domain/model/`
- `GenerarReporteUseCase.java` en `domain/port/in/`
- `ReporteService.java` (POJO) en `domain/service/`
- Método `generarReporte(fechaDesde, fechaHasta)` en `VentaRepository`
- `ReporteController.java` con `GET /api/v1/reportes/cierre`
- `ReporteCierreResponse.java` DTO
- Soporte para `Accept: text/csv` en el mismo endpoint
- `BeanConfig` actualizado con `ReporteService`

**Criterios de aceptación:**
- [ ] Retorna 403 con `ACCESO_DENEGADO` si el rol no es `ADMIN` (SPEC-BE-011)
- [ ] `montoNeto = montoTotal - montoDevuelto` (SPEC-BE-011)
- [ ] Si no hay ventas en el rango, retorna 200 con montos en 0 y arrays vacíos (SPEC-BE-011)
- [ ] `fechaDesde` posterior a `fechaHasta` retorna 400 con `VALIDACION_FALLIDA` (SPEC-BE-011)
- [ ] `Accept: text/csv` retorna el reporte en formato CSV descargable (SPEC-BE-011)
- [ ] `ReporteService` es un POJO sin anotaciones de Spring

**Dependencias previas:** T-BE-09, T-BE-19
**Estimación:** 3h
