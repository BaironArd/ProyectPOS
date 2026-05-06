# Especificaciones del Sistema — Backend POS
**Versión:** 1.3  
**Enfoque:** Spec-Driven Development (SDD) — Capa de API  
**Tecnología:** Java 21 · Spring Boot 3  
**Alcance:** API REST que sirve al Frontend POS. Cada spec describe un contrato HTTP verificable: entrada, transformación, salida y comportamiento ante fallos.

---

## 1. Principios Spec-Driven aplicados al backend

En SDD una especificación de backend es un **contrato de API verificable**. Cada spec define:

| Campo | Descripción |
|---|---|
| **ID** | Identificador único y trazable |
| **Endpoint** | Método HTTP + ruta |
| **Precondición** | Estado del sistema antes de la llamada |
| **Request** | Headers, path params, body exactos |
| **Postcondición** | Estado del sistema después de la llamada |
| **Response exitosa** | HTTP status + body JSON |
| **Respuestas de error** | Casos de fallo con su propio status + body |
| **Criterios de aceptación** | Condiciones booleanas verificables con tests |

> Una spec no dice *cómo* se implementa. Dice *qué contrato debe cumplir* la implementación.

---

## 2. Contexto del sistema

El backend expone una **API REST** consumida exclusivamente por el Frontend POS. Sus responsabilidades son:

- Autenticar usuarios y gestionar sesiones con JWT (roles: CAJERO, ADMIN)
- Gestionar el catálogo de productos (búsqueda pública y administración por ADMIN)
- Registrar y confirmar ventas con múltiples métodos de pago
- Calcular totales, IVA y cambio como operaciones de dominio
- Procesar devoluciones de ventas completadas
- Persistir ventas para auditoría
- Generar reportes de cierre de caja (solo ADMIN)
- Responder errores con estructura uniforme

El frontend no conoce la base de datos ni la lógica de negocio. Todo pasa por esta API.

---

## 3. Convenciones globales de la API

### 3.1 Base URL

```
/api/v1
```

### 3.2 Formato de respuesta exitosa

```json
{
  "data": { },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 3.3 Formato de respuesta de error (uniforme para todos los endpoints)

```json
{
  "error": {
    "codigo": "PRODUCTO_NO_ENCONTRADO",
    "mensaje": "No existe un producto con id 99.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### 3.4 Códigos de error del dominio

| Código | HTTP Status | Descripción |
|---|---|---|
| `PRODUCTO_NO_ENCONTRADO` | 404 | El id de producto no existe |
| `STOCK_INSUFICIENTE` | 422 | Cantidad solicitada > stock disponible |
| `VENTA_MONTO_INSUFICIENTE` | 422 | `montoPagado < total` calculado |
| `QUERY_DEMASIADO_CORTA` | 400 | Query de búsqueda con menos de 2 caracteres |
| `CARRITO_VACIO` | 422 | Intento de confirmar venta sin ítems |
| `CANTIDAD_INVALIDA` | 400 | `cantidad` ≤ 0 en un ítem del carrito |
| `VALIDACION_FALLIDA` | 400 | Error de validación de Bean Validation (`@Valid`) |
| `VENTA_NO_ENCONTRADA` | 404 | ID de venta no existe |
| `CONFLICTO_STOCK` | 409 | Conflicto de concurrencia al descontar stock (optimistic locking) |
| `VENTA_DUPLICADA` | 409 | `idempotencyKey` ya fue procesado — se retorna la venta existente |
| `HISTORIAL_NO_DISPONIBLE` | 503 | Error al consultar el historial de ventas |
| `CREDENCIALES_INVALIDAS` | 401 | Usuario o contraseña incorrectos |
| `TOKEN_INVALIDO` | 401 | JWT expirado o malformado |
| `ACCESO_DENEGADO` | 403 | El rol del usuario no tiene permiso para esta operación |
| `VENTA_YA_DEVUELTA` | 422 | La venta ya fue devuelta anteriormente |
| `VENTA_NO_DEVOLVIBLE` | 422 | La venta no está en estado COMPLETADA |
| `PRODUCTO_DUPLICADO` | 409 | Ya existe un producto activo con ese nombre |
| `ERROR_INTERNO` | 500 | Error no controlado del servidor |

### 3.5 Unidades monetarias

Todos los valores monetarios en la API se expresan en **pesos enteros** (sin decimales). El backend internamente usa centavos para los cálculos, pero serializa y deserializa en pesos. Ejemplo: `30000` = $30.000.

### 3.6 Headers requeridos en todas las peticiones

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt-token>   ← requerido en todos los endpoints excepto /auth/login
```

---

## 4. Especificaciones de Productos

---

### SPEC-BE-001 — Buscar productos por nombre

**ID:** SPEC-BE-001  
**Módulo:** Productos  
**Endpoint:** `GET /api/v1/productos?q={query}`  
**Spec frontend relacionada:** SPEC-001

**Precondición:** El catálogo tiene productos en la base de datos.

**Request:**

```http
GET /api/v1/productos?q=mouse
```

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `q` | String | Sí | Texto a buscar en nombre del producto. Mínimo 2 caracteres. |

**Postcondición:** Sin efecto en el sistema (operación de lectura).

**Response exitosa — 200 OK:**

```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Mouse Óptico USB",
      "precio": 30000,
      "stock": 15,
      "categoria": "Periféricos"
    }
  ],
  "timestamp": "2025-01-15T10:30:00Z"
}
```

> Si no hay coincidencias, `data` es un array vacío `[]`. No es un error.

> El campo `precio` está en pesos enteros. El frontend lo muestra formateado como `$30.000` (SPEC-001, SPEC-004).

**Response de error — 400 Bad Request:**

```json
{
  "error": {
    "codigo": "QUERY_DEMASIADO_CORTA",
    "mensaje": "El término de búsqueda debe tener al menos 2 caracteres.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Criterios de aceptación:**
- [ ] Retorna 200 con lista parcial coincidente por nombre (búsqueda case-insensitive)
- [ ] Retorna 200 con `data: []` si no hay coincidencias — el frontend muestra *"Sin resultados para '[query]'"* (SPEC-001)
- [ ] Retorna 400 con `QUERY_DEMASIADO_CORTA` si `q` tiene menos de 2 caracteres
- [ ] Retorna 400 si el parámetro `q` está ausente
- [ ] La búsqueda es parcial: `"mou"` debe encontrar `"Mouse Óptico"`
- [ ] Los resultados incluyen siempre el campo `stock` — el frontend lo usa para desactivar el botón "Agregar" (SPEC-002)

---

### SPEC-BE-002 — Obtener producto por ID

**ID:** SPEC-BE-002  
**Módulo:** Productos  
**Endpoint:** `GET /api/v1/productos/{id}`  
**Spec frontend relacionada:** Consulta de auditoría / validación interna

**Request:**

```http
GET /api/v1/productos/1
```

**Response exitosa — 200 OK:**

```json
{
  "data": {
    "id": 1,
    "nombre": "Mouse Óptico USB",
    "precio": 30000,
    "stock": 15,
    "categoria": "Periféricos"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Response de error — 404 Not Found:**

```json
{
  "error": {
    "codigo": "PRODUCTO_NO_ENCONTRADO",
    "mensaje": "No existe un producto con id 99.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Criterios de aceptación:**
- [ ] Retorna 200 con el producto completo si el id existe
- [ ] Retorna 404 con código `PRODUCTO_NO_ENCONTRADO` si el id no existe
- [ ] El campo `id` en la respuesta coincide con el `id` solicitado

---

## 5. Especificaciones de Ventas

---

### SPEC-BE-003 — Confirmar venta

**ID:** SPEC-BE-003  
**Módulo:** Ventas  
**Endpoint:** `POST /api/v1/ventas`  
**Spec frontend relacionada:** SPEC-006

**Precondición:** Los productos en el body existen y tienen stock suficiente.

**Request body:**

```json
{
  "items": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 5, "cantidad": 1 }
  ],
  "montoPagado": 150000,
  "idempotencyKey": "frontend-uuid-v4-generado-por-el-cliente"
}
```

> **Idempotencia:** el frontend genera un `idempotencyKey` (UUID v4) antes de enviar la petición. Si la misma clave llega dos veces (por reintento tras timeout), el backend retorna la venta ya creada con HTTP 200 en lugar de crear una duplicada. Si la clave es nueva, procesa normalmente y retorna 201.

> El frontend envía `montoPagado` en pesos enteros, igual que el campo `total` que calcula localmente. El backend **recalcula el total de forma independiente** y no confía en ningún valor de totales enviado por el cliente.

**Transformaciones de dominio (calculadas por el backend):**

```
subtotal    = Σ (precio_producto × cantidad)
iva         = round(subtotal × 0.19)
total       = subtotal + iva
cambio      = montoPagado − total
```

Estas fórmulas son idénticas a las del frontend (SPEC-004, SPEC-005). El backend es la fuente de verdad.

**Postcondición:**
- Se crea un registro de venta en la base de datos con estado `COMPLETADA`
- El stock de cada producto se descuenta: `stock = stock - cantidad`

**Response exitosa — 201 Created:**

```json
{
  "data": {
    "ventaId": "VNT-20250115-001",
    "items": [
      {
        "productoId": 1,
        "nombre": "Mouse Óptico USB",
        "cantidad": 2,
        "precioUnitario": 30000,
        "subtotal": 60000
      },
      {
        "productoId": 5,
        "nombre": "Teclado Mecánico",
        "cantidad": 1,
        "precioUnitario": 55000,
        "subtotal": 55000
      }
    ],
    "resumen": {
      "subtotal": 115000,
      "iva": 21850,
      "total": 136850,
      "montoPagado": 150000,
      "cambio": 13150
    },
    "estado": "COMPLETADA",
    "fechaHora": "2025-01-15T10:30:00Z"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

> El frontend usa `cambio` de esta respuesta para mostrar *"¡Venta completada! Cambio: $X.XXX"* (SPEC-006).

**Respuestas de error:**

| Condición | HTTP | Código de error |
|---|---|---|
| `items` está vacío | 422 | `CARRITO_VACIO` |
| `montoPagado < total` calculado | 422 | `VENTA_MONTO_INSUFICIENTE` |
| Un `productoId` no existe | 404 | `PRODUCTO_NO_ENCONTRADO` |
| `cantidad` > `stock` del producto | 422 | `STOCK_INSUFICIENTE` |
| `cantidad` ≤ 0 | 400 | `CANTIDAD_INVALIDA` |
| `idempotencyKey` ya procesado | 200 | — (retorna venta existente, no es error) |
| Conflicto de concurrencia en stock | 409 | `CONFLICTO_STOCK` |

**Criterios de aceptación:**
- [ ] Retorna 201 con `ventaId` único, resumen completo y cambio calculado
- [ ] El stock de cada producto se reduce en la cantidad vendida tras la confirmación
- [ ] Retorna 422 con `CARRITO_VACIO` si `items` está vacío
- [ ] Retorna 422 con `VENTA_MONTO_INSUFICIENTE` si `montoPagado < total` (el backend recalcula, no confía en el frontend)
- [ ] Retorna 404 con `PRODUCTO_NO_ENCONTRADO` si cualquier `productoId` del body no existe
- [ ] Retorna 422 con `STOCK_INSUFICIENTE` si la cantidad pedida supera el stock
- [ ] Retorna 400 con `CANTIDAD_INVALIDA` si alguna `cantidad` es ≤ 0
- [ ] La operación es **atómica**: si falla cualquier validación, ningún stock se modifica
- [ ] Si `idempotencyKey` ya fue procesado, retorna 200 con la venta existente sin crear duplicado
- [ ] Si dos peticiones concurrentes intentan descontar el mismo stock y una falla por optimistic locking, retorna 409 con `CONFLICTO_STOCK`

---

### SPEC-BE-004 — Obtener venta por ID

**ID:** SPEC-BE-004  
**Módulo:** Ventas  
**Endpoint:** `GET /api/v1/ventas/{ventaId}`  
**Spec frontend relacionada:** Consulta de auditoría (sin spec frontend directa)

**Request:**

```http
GET /api/v1/ventas/VNT-20250115-001
```

**Response exitosa — 200 OK:**

Misma estructura que la respuesta de SPEC-BE-003 `data`.

**Response de error — 404:**

```json
{
  "error": {
    "codigo": "VENTA_NO_ENCONTRADA",
    "mensaje": "No existe una venta con id VNT-20250115-001.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Criterios de aceptación:**
- [ ] Retorna 200 con la venta completa si el `ventaId` existe
- [ ] Retorna 404 con `VENTA_NO_ENCONTRADA` si el `ventaId` no existe

---

## 6. Especificación transversal — Manejo de errores global

**ID:** SPEC-BE-005  
**Módulo:** Transversal  
**Mecanismo:** `@RestControllerAdvice` global de Spring Boot  
**Spec frontend relacionada:** SPEC-007

**Precondición:** Cualquier endpoint lanza una excepción de dominio o de validación.

**Contrato:** Todo error del sistema — sea de validación, de negocio o inesperado — responde con la **estructura uniforme** definida en §3.3.

> El frontend consume el campo `error.codigo` para mostrar mensajes diferenciados en el `ErrorBanner` (SPEC-007). Cada código de §3.4 debe tener un mensaje único y legible.

**Criterios de aceptación:**
- [ ] Ningún endpoint puede retornar un error fuera del formato `{ "error": { "codigo", "mensaje", "timestamp" } }`
- [ ] Los errores 500 no exponen stack traces al cliente
- [ ] Los errores de validación de Bean Validation (`@Valid`) producen 400 con código `VALIDACION_FALLIDA` y los nombres de campo inválidos en el mensaje
- [ ] El `timestamp` del error refleja el momento real de la excepción
- [ ] Cada código de error de §3.4 produce un mensaje diferenciado — no un mensaje genérico único

---

## 7. Matriz de trazabilidad con el Frontend

| Spec Backend | Spec Frontend | Endpoint | Propósito |
|---|---|---|---|
| SPEC-BE-001 | SPEC-001 | `GET /api/v1/productos?q=` | Búsqueda en tiempo real — alimenta `ProductList` |
| SPEC-BE-001b | SPEC-001 | `GET /api/v1/productos?q=&page=&size=` | Búsqueda paginada para catálogos grandes |
| SPEC-BE-002 | — | `GET /api/v1/productos/{id}` | Consulta individual de producto |
| SPEC-BE-003 | SPEC-006, SPEC-014 | `POST /api/v1/ventas` | Confirmar venta con método de pago |
| SPEC-BE-004 | SPEC-008 | `GET /api/v1/ventas/{id}` | Consulta de auditoría post-venta |
| SPEC-BE-005 | SPEC-007 | Transversal | Errores estructurados que alimentan `ErrorBanner` |
| SPEC-BE-006 | SPEC-008 | `GET /api/v1/ventas?page=&size=` | Historial de ventas del turno |
| SPEC-BE-007 | — | Transversal | Concurrencia de stock |
| SPEC-BE-008 | SPEC-009, SPEC-010 | `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` | Autenticación JWT |
| SPEC-BE-009 | SPEC-011 | `POST /api/v1/ventas/{id}/devolucion` | Devolución de venta |
| SPEC-BE-010 | SPEC-012 | `GET/POST/PUT /api/v1/admin/productos` | Gestión de inventario (admin) |
| SPEC-BE-011 | SPEC-013 | `GET /api/v1/reportes/cierre` | Reporte de cierre de caja (admin) |

> **Nota de alineación:** el campo `stock` en SPEC-BE-001 es requerido porque SPEC-002 del frontend desactiva el botón "Agregar" cuando `stock === 0`. El campo `cambio` en SPEC-BE-003 es requerido porque SPEC-006 del frontend muestra *"¡Venta completada! Cambio: $X.XXX"* con ese valor.

---

## 8. Especificaciones adicionales

---

### SPEC-BE-001b — Búsqueda paginada de productos

**ID:** SPEC-BE-001b
**Módulo:** Productos
**Endpoint:** `GET /api/v1/productos?q={query}&page={page}&size={size}`
**Spec frontend relacionada:** SPEC-001 (extensión para catálogos grandes)

**Request:**

```http
GET /api/v1/productos?q=mouse&page=0&size=10
```

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `q` | String | Sí | Texto a buscar. Mínimo 2 caracteres. |
| `page` | Integer | No | Número de página (0-indexed). Default: 0. |
| `size` | Integer | No | Tamaño de página. Default: 20. Máximo: 100. |

**Response exitosa — 200 OK:**

```json
{
  "data": {
    "items": [
      { "id": 1, "nombre": "Mouse Óptico USB", "precio": 30000, "stock": 15, "categoria": "Periféricos" }
    ],
    "total": 45,
    "page": 0,
    "size": 10,
    "totalPages": 5
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Criterios de aceptación:**
- [ ] Retorna 200 con `items`, `total`, `page`, `size` y `totalPages`
- [ ] `items` contiene exactamente `size` elementos (o menos si es la última página)
- [ ] `total` refleja el número total de productos que coinciden con `q`, no solo los de la página actual
- [ ] `page=0` retorna los primeros `size` resultados
- [ ] Si `size > 100`, retorna 400 con `VALIDACION_FALLIDA`
- [ ] Si `page >= totalPages`, retorna 200 con `items: []`

---

### SPEC-BE-006 — Listar ventas (historial del turno)

**ID:** SPEC-BE-006
**Módulo:** Ventas
**Endpoint:** `GET /api/v1/ventas?page={page}&size={size}`
**Spec frontend relacionada:** SPEC-008

**Request:**

```http
GET /api/v1/ventas?page=0&size=20
```

**Response exitosa — 200 OK:**

```json
{
  "data": {
    "items": [
      {
        "ventaId": "VNT-20250115-001",
        "fechaHora": "2025-01-15T10:30:00Z",
        "total": 136850,
        "cantidadItems": 3,
        "estado": "COMPLETADA"
      }
    ],
    "total": 5,
    "page": 0,
    "size": 20,
    "totalPages": 1
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

> El frontend usa este endpoint para alimentar el componente `SalesHistory` (SPEC-008). El campo `total` de cada ítem se formatea como `$136.850` en la UI.

**Criterios de aceptación:**
- [ ] Retorna 200 con lista paginada de ventas ordenadas por `fechaHora` descendente
- [ ] Cada ítem incluye `ventaId`, `fechaHora`, `total`, `cantidadItems` y `estado`
- [ ] Si no hay ventas, retorna 200 con `items: []` — el frontend muestra *"No hay ventas registradas en este turno"*
- [ ] Soporta paginación con los mismos parámetros que SPEC-BE-001b

---

### SPEC-BE-007 — Control de concurrencia en stock (Optimistic Locking)

**ID:** SPEC-BE-007
**Módulo:** Transversal — Infraestructura de persistencia
**Mecanismo:** `@Version` en `ProductoEntity` (JPA Optimistic Locking)

**Precondición:** Dos peticiones `POST /api/v1/ventas` llegan simultáneamente y ambas intentan descontar stock del mismo producto.

**Contrato:** Solo una de las dos peticiones puede completarse. La segunda detecta el conflicto y retorna un error controlado.

**Postcondición:**
- La primera petición completa la venta y descuenta el stock correctamente
- La segunda petición recibe 409 con código `CONFLICTO_STOCK`
- El stock nunca queda en un estado inconsistente

**Criterios de aceptación:**
- [ ] `ProductoEntity` tiene un campo `@Version Long version` que JPA incrementa en cada `save`
- [ ] Si JPA lanza `OptimisticLockException` durante `saveAll`, el `GlobalExceptionHandler` la captura y retorna 409 con `CONFLICTO_STOCK`
- [ ] El mensaje de error indica que el usuario debe reintentar la operación
- [ ] El stock del producto no queda modificado si la excepción ocurre (garantizado por `@Transactional`)

---

### SPEC-BE-008 — Autenticación (Login / Logout)

**ID:** SPEC-BE-008
**Módulo:** Autenticación
**Endpoints:** `POST /api/v1/auth/login` · `POST /api/v1/auth/logout`
**Spec frontend relacionada:** SPEC-009, SPEC-010

**Request login:**
```json
{ "usuario": "cajero01", "contrasena": "secreto123" }
```

**Response exitosa login — 200 OK:**
```json
{
  "data": {
    "token": "eyJhbGci...",
    "usuario": "cajero01",
    "rol": "CAJERO",
    "expiresIn": 28800
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Response de error — 401:**
```json
{ "error": { "codigo": "CREDENCIALES_INVALIDAS", "mensaje": "Usuario o contraseña incorrectos.", "timestamp": "..." } }
```

**Criterios de aceptación:**
- [ ] Retorna 200 con JWT, usuario, rol y tiempo de expiración si las credenciales son válidas
- [ ] Retorna 401 con `CREDENCIALES_INVALIDAS` si usuario o contraseña son incorrectos — sin indicar cuál
- [ ] El JWT expira en 8 horas (`expiresIn: 28800` segundos)
- [ ] `POST /api/v1/auth/logout` invalida el token en el servidor (blacklist) y retorna 204
- [ ] Todos los endpoints excepto `/auth/login` requieren el header `Authorization: Bearer <token>`
- [ ] Un token expirado o inválido retorna 401 con `TOKEN_INVALIDO`

---

### SPEC-BE-009 — Devolución de venta

**ID:** SPEC-BE-009
**Módulo:** Ventas
**Endpoint:** `POST /api/v1/ventas/{ventaId}/devolucion`
**Spec frontend relacionada:** SPEC-011

**Precondición:** La venta existe y tiene estado `COMPLETADA`.

**Response exitosa — 200 OK:**
```json
{
  "data": {
    "ventaId": "VNT-20250115-001",
    "montoDevuelto": 136850,
    "estado": "DEVUELTA",
    "fechaDevolucion": "2025-01-15T11:00:00Z"
  },
  "timestamp": "2025-01-15T11:00:00Z"
}
```

**Respuestas de error:**

| Condición | HTTP | Código |
|---|---|---|
| Venta no existe | 404 | `VENTA_NO_ENCONTRADA` |
| Venta ya fue devuelta | 422 | `VENTA_YA_DEVUELTA` |
| Venta no está en estado COMPLETADA | 422 | `VENTA_NO_DEVOLVIBLE` |

**Criterios de aceptación:**
- [ ] Retorna 200 con el monto devuelto y el nuevo estado `DEVUELTA`
- [ ] El stock de todos los productos de la venta se restaura
- [ ] La venta queda con estado `DEVUELTA` — no se puede devolver dos veces
- [ ] Retorna 422 con `VENTA_YA_DEVUELTA` si ya fue devuelta
- [ ] La operación es atómica: si falla la restauración de stock, la venta no cambia de estado

---

### SPEC-BE-010 — Gestión de inventario (Admin)

**ID:** SPEC-BE-010
**Módulo:** Inventario
**Endpoints:** `GET/POST /api/v1/admin/productos` · `PUT /api/v1/admin/productos/{id}` · `PATCH /api/v1/admin/productos/{id}/toggle`
**Spec frontend relacionada:** SPEC-012
**Requiere rol:** `ADMIN`

**GET /api/v1/admin/productos — 200 OK:**
```json
{
  "data": [
    { "id": 1, "nombre": "Mouse Óptico USB", "precio": 30000, "stock": 15, "categoria": "Periféricos", "activo": true }
  ],
  "timestamp": "..."
}
```

**POST /api/v1/admin/productos (crear) — 201 Created:**
```json
{ "nombre": "Nuevo Producto", "precio": 25000, "stock": 10, "categoria": "General" }
```

**PUT /api/v1/admin/productos/{id} (editar) — 200 OK**

**PATCH /api/v1/admin/productos/{id}/toggle (activar/desactivar) — 200 OK**

**Criterios de aceptación:**
- [ ] Retorna 403 con `ACCESO_DENEGADO` si el rol no es `ADMIN`
- [ ] `GET` retorna todos los productos incluyendo los inactivos (a diferencia de SPEC-BE-001 que solo retorna activos)
- [ ] `POST` retorna 409 con `PRODUCTO_DUPLICADO` si ya existe un producto activo con el mismo nombre
- [ ] `PATCH /toggle` alterna el campo `activo` — un producto inactivo no aparece en búsquedas de cajero
- [ ] `PUT` valida que el precio sea positivo — retorna 400 con `VALIDACION_FALLIDA` si no

---

### SPEC-BE-011 — Reporte de cierre de caja (Admin)

**ID:** SPEC-BE-011
**Módulo:** Reportes
**Endpoint:** `GET /api/v1/reportes/cierre?fechaDesde={date}&fechaHasta={date}`
**Spec frontend relacionada:** SPEC-013
**Requiere rol:** `ADMIN`

**Request:**
```http
GET /api/v1/reportes/cierre?fechaDesde=2025-01-15&fechaHasta=2025-01-15
```

**Response exitosa — 200 OK:**
```json
{
  "data": {
    "fechaDesde": "2025-01-15",
    "fechaHasta": "2025-01-15",
    "totalVentas": 5,
    "totalDevueltas": 1,
    "montoTotal": 684250,
    "montoDevuelto": 136850,
    "montoNeto": 547400,
    "ventasPorCajero": [
      { "usuario": "cajero01", "ventas": 3, "monto": 410000 },
      { "usuario": "cajero02", "ventas": 2, "monto": 274250 }
    ]
  },
  "timestamp": "..."
}
```

**Criterios de aceptación:**
- [ ] Retorna 403 con `ACCESO_DENEGADO` si el rol no es `ADMIN`
- [ ] `montoNeto = montoTotal - montoDevuelto`
- [ ] Si no hay ventas en el rango, retorna 200 con todos los montos en 0 y arrays vacíos
- [ ] `fechaDesde` no puede ser posterior a `fechaHasta` — retorna 400 con `VALIDACION_FALLIDA`
- [ ] El endpoint también acepta `Accept: text/csv` para exportar directamente en CSV
