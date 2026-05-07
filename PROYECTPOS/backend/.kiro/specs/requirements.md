# System Requirements — Backend POS
**Version:** 1.3  
**Approach:** Spec-Driven Development (SDD) — API Layer  
**Technology:** Java 21 · Spring Boot 3  
**Scope:** REST API serving the POS Frontend. Each spec describes a verifiable HTTP contract: input, transformation, output and failure behavior.

---

## 1. Spec-Driven Principles Applied to the Backend

In SDD a backend specification is a **verifiable API contract**. Each spec defines:

| Field | Description |
|---|---|
| **ID** | Unique and traceable identifier |
| **Endpoint** | HTTP method + path |
| **Precondition** | System state before the call |
| **Request** | Exact headers, path params, body |
| **Postcondition** | System state after the call |
| **Success response** | HTTP status + JSON body |
| **Error responses** | Failure cases with their own status + body |
| **Acceptance criteria** | Boolean conditions verifiable with tests |

> A spec does not say *how* it is implemented. It says *what contract* the implementation must fulfill.

---

## 2. System Context

The backend exposes a **REST API** consumed exclusively by the POS Frontend. Its responsibilities are:

- Authenticate users and manage sessions with JWT (roles: CAJERO, ADMIN)
- Manage the product catalog (public search and ADMIN management)
- Register and confirm sales with multiple payment methods
- Calculate totals, VAT and change as domain operations
- Process returns of completed sales
- Persist sales for auditing
- Generate end-of-day reports (ADMIN only)
- Respond to errors with a uniform structure

The frontend does not know the database or the business logic. Everything goes through this API.

---

## 3. Global API Conventions

### 3.1 Base URL

```
/api/v1
```

### 3.2 Successful response format

```json
{
  "data": { },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 3.3 Error response format (uniform for all endpoints)

```json
{
  "error": {
    "codigo": "PRODUCTO_NO_ENCONTRADO",
    "mensaje": "No product exists with id 99.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### 3.4 Domain error codes

| Code | HTTP Status | Description |
|---|---|---|
| `PRODUCTO_NO_ENCONTRADO` | 404 | Product id does not exist |
| `STOCK_INSUFICIENTE` | 422 | Requested quantity > available stock |
| `VENTA_MONTO_INSUFICIENTE` | 422 | `montoPagado < total` calculated |
| `QUERY_DEMASIADO_CORTA` | 400 | Search query with fewer than 2 characters |
| `CARRITO_VACIO` | 422 | Attempt to confirm sale with no items |
| `CANTIDAD_INVALIDA` | 400 | `cantidad` ≤ 0 in a cart item |
| `VALIDACION_FALLIDA` | 400 | Bean Validation error (`@Valid`) |
| `VENTA_NO_ENCONTRADA` | 404 | Sale ID does not exist |
| `CONFLICTO_STOCK` | 409 | Concurrency conflict when deducting stock (optimistic locking) |
| `VENTA_DUPLICADA` | 409 | `idempotencyKey` already processed — existing sale is returned |
| `HISTORIAL_NO_DISPONIBLE` | 503 | Error querying the sales history |
| `CREDENCIALES_INVALIDAS` | 401 | Incorrect username or password |
| `TOKEN_INVALIDO` | 401 | Expired or malformed JWT |
| `ACCESO_DENEGADO` | 403 | User role does not have permission for this operation |
| `VENTA_YA_DEVUELTA` | 422 | Sale was already returned |
| `VENTA_NO_DEVOLVIBLE` | 422 | Sale is not in COMPLETADA state |
| `PRODUCTO_DUPLICADO` | 409 | An active product with that name already exists |
| `ERROR_INTERNO` | 500 | Unhandled server error |

### 3.5 Monetary units

All monetary values in the API are expressed in **whole pesos** (no decimals). The backend internally uses cents for calculations, but serializes and deserializes in pesos. Example: `30000` = $30,000.

### 3.6 Required headers on all requests

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt-token>   ← required on all endpoints except /auth/login
```

---

## 4. Product Specifications

---

### SPEC-BE-001 — Search products by name

**ID:** SPEC-BE-001  
**Module:** Products  
**Endpoint:** `GET /api/v1/productos?q={query}`  
**Related frontend spec:** SPEC-001

**Precondition:** The catalog has products in the database.

**Request:**

```http
GET /api/v1/productos?q=mouse
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | String | Yes | Text to search in product name. Minimum 2 characters. |

**Postcondition:** No effect on the system (read operation).

**Success response — 200 OK:**

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

> If there are no matches, `data` is an empty array `[]`. This is not an error.

> The `precio` field is in whole pesos. The frontend displays it formatted as `$30.000` (SPEC-001, SPEC-004).

**Error response — 400 Bad Request:**

```json
{
  "error": {
    "codigo": "QUERY_DEMASIADO_CORTA",
    "mensaje": "The search term must have at least 2 characters.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Acceptance criteria:**
- [ ] Returns 200 with partial matching list by name (case-insensitive search)
- [ ] Returns 200 with `data: []` if no matches — the frontend shows *"No results for '[query]'"* (SPEC-001)
- [ ] Returns 400 with `QUERY_DEMASIADO_CORTA` if `q` has fewer than 2 characters
- [ ] Returns 400 if the `q` parameter is absent
- [ ] Search is partial: `"mou"` must find `"Mouse Óptico"`
- [ ] Results always include the `stock` field — the frontend uses it to disable the "Add" button (SPEC-002)

---

### SPEC-BE-002 — Get product by ID

**ID:** SPEC-BE-002  
**Module:** Products  
**Endpoint:** `GET /api/v1/productos/{id}`  
**Related frontend spec:** Audit query / internal validation

**Request:**

```http
GET /api/v1/productos/1
```

**Success response — 200 OK:**

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

**Error response — 404 Not Found:**

```json
{
  "error": {
    "codigo": "PRODUCTO_NO_ENCONTRADO",
    "mensaje": "No product exists with id 99.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Acceptance criteria:**
- [ ] Returns 200 with the complete product if the id exists
- [ ] Returns 404 with code `PRODUCTO_NO_ENCONTRADO` if the id does not exist
- [ ] The `id` field in the response matches the requested `id`

---

## 5. Sale Specifications

---

### SPEC-BE-003 — Confirm sale

**ID:** SPEC-BE-003  
**Module:** Sales  
**Endpoint:** `POST /api/v1/ventas`  
**Related frontend spec:** SPEC-006

**Precondition:** The products in the body exist and have sufficient stock.

**Request body:**

```json
{
  "items": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 5, "cantidad": 1 }
  ],
  "montoPagado": 150000,
  "idempotencyKey": "frontend-uuid-v4-generated-by-client"
}
```

> **Idempotency:** the frontend generates an `idempotencyKey` (UUID v4) before sending the request. If the same key arrives twice (due to a retry after timeout), the backend returns the already-created sale with HTTP 200 instead of creating a duplicate. If the key is new, it processes normally and returns 201.

> The frontend sends `montoPagado` in whole pesos, the same as the `total` it calculates locally. The backend **recalculates the total independently** and does not trust any total values sent by the client.

**Domain transformations (calculated by the backend):**

```
subtotal    = Σ (product_price × quantity)
iva         = round(subtotal × 0.19)
total       = subtotal + iva
cambio      = montoPagado − total
```

These formulas are identical to those of the frontend (SPEC-004, SPEC-005). The backend is the source of truth.

**Postcondition:**
- A sale record is created in the database with state `COMPLETADA`
- The stock of each product is deducted: `stock = stock - quantity`

**Success response — 201 Created:**

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

> The frontend uses `cambio` from this response to show *"Sale completed! Change: $X,XXX"* (SPEC-006).

**Error responses:**

| Condition | HTTP | Error code |
|---|---|---|
| `items` is empty | 422 | `CARRITO_VACIO` |
| `montoPagado < total` calculated | 422 | `VENTA_MONTO_INSUFICIENTE` |
| A `productoId` does not exist | 404 | `PRODUCTO_NO_ENCONTRADO` |
| `cantidad` > product `stock` | 422 | `STOCK_INSUFICIENTE` |
| `cantidad` ≤ 0 | 400 | `CANTIDAD_INVALIDA` |
| `idempotencyKey` already processed | 200 | — (returns existing sale, not an error) |
| Stock concurrency conflict | 409 | `CONFLICTO_STOCK` |

**Acceptance criteria:**
- [ ] Returns 201 with unique `ventaId`, complete summary and calculated change
- [ ] The stock of each product is reduced by the sold quantity after confirmation
- [ ] Returns 422 with `CARRITO_VACIO` if `items` is empty
- [ ] Returns 422 with `VENTA_MONTO_INSUFICIENTE` if `montoPagado < total` (backend recalculates, does not trust frontend)
- [ ] Returns 404 with `PRODUCTO_NO_ENCONTRADO` if any `productoId` in the body does not exist
- [ ] Returns 422 with `STOCK_INSUFICIENTE` if the requested quantity exceeds stock
- [ ] Returns 400 with `CANTIDAD_INVALIDA` if any `cantidad` is ≤ 0
- [ ] The operation is **atomic**: if any validation fails, no stock is modified
- [ ] If `idempotencyKey` was already processed, returns 200 with the existing sale without creating a duplicate
- [ ] If two concurrent requests try to deduct the same stock and one fails due to optimistic locking, returns 409 with `CONFLICTO_STOCK`

---

### SPEC-BE-004 — Get sale by ID

**ID:** SPEC-BE-004  
**Module:** Sales  
**Endpoint:** `GET /api/v1/ventas/{ventaId}`  
**Related frontend spec:** Audit query (no direct frontend spec)

**Request:**

```http
GET /api/v1/ventas/VNT-20250115-001
```

**Success response — 200 OK:**

Same structure as the SPEC-BE-003 `data` response.

**Error response — 404:**

```json
{
  "error": {
    "codigo": "VENTA_NO_ENCONTRADA",
    "mensaje": "No sale exists with id VNT-20250115-001.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Acceptance criteria:**
- [ ] Returns 200 with the complete sale if the `ventaId` exists
- [ ] Returns 404 with `VENTA_NO_ENCONTRADA` if the `ventaId` does not exist

---

## 6. Cross-Cutting Specification — Global Error Handling

**ID:** SPEC-BE-005  
**Module:** Cross-cutting  
**Mechanism:** Global `@RestControllerAdvice` in Spring Boot  
**Related frontend spec:** SPEC-007

**Precondition:** Any endpoint throws a domain or validation exception.

**Contract:** Every system error — whether validation, business or unexpected — responds with the **uniform structure** defined in §3.3.

> The frontend consumes the `error.codigo` field to show differentiated messages in the `ErrorBanner` (SPEC-007). Each code in §3.4 must have a unique and readable message.

**Acceptance criteria:**
- [ ] No endpoint can return an error outside the format `{ "error": { "codigo", "mensaje", "timestamp" } }`
- [ ] 500 errors do not expose stack traces to the client
- [ ] Bean Validation errors (`@Valid`) produce 400 with code `VALIDACION_FALLIDA` and the invalid field names in the message
- [ ] The `timestamp` of the error reflects the actual moment of the exception
- [ ] Each error code in §3.4 produces a differentiated message — not a single generic message

---

## 7. Traceability Matrix with the Frontend

| Backend Spec | Frontend Spec | Endpoint | Purpose |
|---|---|---|---|
| SPEC-BE-001 | SPEC-001 | `GET /api/v1/productos?q=` | Real-time search — feeds `ProductList` |
| SPEC-BE-001b | SPEC-001 | `GET /api/v1/productos?q=&page=&size=` | Paginated search for large catalogs |
| SPEC-BE-002 | — | `GET /api/v1/productos/{id}` | Individual product query |
| SPEC-BE-003 | SPEC-006, SPEC-014 | `POST /api/v1/ventas` | Confirm sale with payment method |
| SPEC-BE-004 | SPEC-008 | `GET /api/v1/ventas/{id}` | Post-sale audit query |
| SPEC-BE-005 | SPEC-007 | Cross-cutting | Structured errors that feed `ErrorBanner` |
| SPEC-BE-006 | SPEC-008 | `GET /api/v1/ventas?page=&size=` | Shift sales history |
| SPEC-BE-007 | — | Cross-cutting | Stock concurrency |
| SPEC-BE-008 | SPEC-009, SPEC-010 | `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` | JWT authentication |
| SPEC-BE-009 | SPEC-011 | `POST /api/v1/ventas/{id}/devolucion` | Sale return |
| SPEC-BE-010 | SPEC-012 | `GET/POST/PUT /api/v1/admin/productos` | Inventory management (admin) |
| SPEC-BE-011 | SPEC-013 | `GET /api/v1/reportes/cierre` | End-of-day report (admin) |

> **Alignment note:** the `stock` field in SPEC-BE-001 is required because SPEC-002 of the frontend disables the "Add" button when `stock === 0`. The `cambio` field in SPEC-BE-003 is required because SPEC-006 of the frontend shows *"Sale completed! Change: $X,XXX"* with that value.

---

## 8. Additional Specifications

---

### SPEC-BE-001b — Paginated product search

**ID:** SPEC-BE-001b
**Module:** Products
**Endpoint:** `GET /api/v1/productos?q={query}&page={page}&size={size}`
**Related frontend spec:** SPEC-001 (extension for large catalogs)

**Request:**

```http
GET /api/v1/productos?q=mouse&page=0&size=10
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | String | Yes | Text to search. Minimum 2 characters. |
| `page` | Integer | No | Page number (0-indexed). Default: 0. |
| `size` | Integer | No | Page size. Default: 20. Maximum: 100. |

**Success response — 200 OK:**

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

**Acceptance criteria:**
- [ ] Returns 200 with `items`, `total`, `page`, `size` and `totalPages`
- [ ] `items` contains exactly `size` elements (or fewer if it is the last page)
- [ ] `total` reflects the total number of products matching `q`, not just those on the current page
- [ ] `page=0` returns the first `size` results
- [ ] If `size > 100`, returns 400 with `VALIDACION_FALLIDA`
- [ ] If `page >= totalPages`, returns 200 with `items: []`

---

### SPEC-BE-006 — List sales (shift history)

**ID:** SPEC-BE-006
**Module:** Sales
**Endpoint:** `GET /api/v1/ventas?page={page}&size={size}`
**Related frontend spec:** SPEC-008

**Request:**

```http
GET /api/v1/ventas?page=0&size=20
```

**Success response — 200 OK:**

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

> The frontend uses this endpoint to feed the `SalesHistory` component (SPEC-008). The `total` field of each item is formatted as `$136,850` in the UI.

**Acceptance criteria:**
- [ ] Returns 200 with paginated list of sales ordered by `fechaHora` descending
- [ ] Each item includes `ventaId`, `fechaHora`, `total`, `cantidadItems` and `estado`
- [ ] If there are no sales, returns 200 with `items: []` — the frontend shows *"No sales recorded in this shift"*
- [ ] Supports pagination with the same parameters as SPEC-BE-001b

---

### SPEC-BE-007 — Stock concurrency control (Optimistic Locking)

**ID:** SPEC-BE-007
**Module:** Cross-cutting — Persistence infrastructure
**Mechanism:** `@Version` on `ProductoEntity` (JPA Optimistic Locking)

**Precondition:** Two `POST /api/v1/ventas` requests arrive simultaneously and both try to deduct stock from the same product.

**Contract:** Only one of the two requests can complete. The second detects the conflict and returns a controlled error.

**Postcondition:**
- The first request completes the sale and correctly deducts the stock
- The second request receives 409 with code `CONFLICTO_STOCK`
- The stock never ends up in an inconsistent state

**Acceptance criteria:**
- [ ] `ProductoEntity` has a `@Version Long version` field that JPA increments on each `save`
- [ ] If JPA throws `OptimisticLockException` during `saveAll`, the `GlobalExceptionHandler` catches it and returns 409 with `CONFLICTO_STOCK`
- [ ] The error message indicates that the user should retry the operation
- [ ] The product stock is not modified if the exception occurs (guaranteed by `@Transactional`)

---

### SPEC-BE-008 — Authentication (Login / Logout)

**ID:** SPEC-BE-008
**Module:** Authentication
**Endpoints:** `POST /api/v1/auth/login` · `POST /api/v1/auth/logout`
**Related frontend spec:** SPEC-009, SPEC-010

**Login request:**
```json
{ "usuario": "cajero01", "contrasena": "secreto123" }
```

**Successful login response — 200 OK:**
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

**Error response — 401:**
```json
{ "error": { "codigo": "CREDENCIALES_INVALIDAS", "mensaje": "Invalid username or password.", "timestamp": "..." } }
```

**Acceptance criteria:**
- [ ] Returns 200 with JWT, username, role and expiration time if credentials are valid
- [ ] Returns 401 with `CREDENCIALES_INVALIDAS` if username or password are incorrect — without indicating which
- [ ] The JWT expires in 8 hours (`expiresIn: 28800` seconds)
- [ ] `POST /api/v1/auth/logout` invalidates the token on the server (blacklist) and returns 204
- [ ] All endpoints except `/auth/login` require the `Authorization: Bearer <token>` header
- [ ] An expired or invalid token returns 401 with `TOKEN_INVALIDO`

---

### SPEC-BE-009 — Sale return

**ID:** SPEC-BE-009
**Module:** Sales
**Endpoint:** `POST /api/v1/ventas/{ventaId}/devolucion`
**Related frontend spec:** SPEC-011

**Precondition:** The sale exists and has state `COMPLETADA`.

**Success response — 200 OK:**
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

**Error responses:**

| Condition | HTTP | Code |
|---|---|---|
| Sale does not exist | 404 | `VENTA_NO_ENCONTRADA` |
| Sale was already returned | 422 | `VENTA_YA_DEVUELTA` |
| Sale is not in COMPLETADA state | 422 | `VENTA_NO_DEVOLVIBLE` |

**Acceptance criteria:**
- [ ] Returns 200 with the returned amount and the new state `DEVUELTA`
- [ ] The stock of all products in the sale is restored
- [ ] The sale is left with state `DEVUELTA` — it cannot be returned twice
- [ ] Returns 422 with `VENTA_YA_DEVUELTA` if it was already returned
- [ ] The operation is atomic: if stock restoration fails, the sale does not change state

---

### SPEC-BE-010 — Inventory management (Admin)

**ID:** SPEC-BE-010
**Module:** Inventory
**Endpoints:** `GET/POST /api/v1/admin/productos` · `PUT /api/v1/admin/productos/{id}` · `PATCH /api/v1/admin/productos/{id}/toggle`
**Related frontend spec:** SPEC-012
**Required role:** `ADMIN`

**GET /api/v1/admin/productos — 200 OK:**
```json
{
  "data": [
    { "id": 1, "nombre": "Mouse Óptico USB", "precio": 30000, "stock": 15, "categoria": "Periféricos", "activo": true }
  ],
  "timestamp": "..."
}
```

**POST /api/v1/admin/productos (create) — 201 Created:**
```json
{ "nombre": "New Product", "precio": 25000, "stock": 10, "categoria": "General" }
```

**PUT /api/v1/admin/productos/{id} (edit) — 200 OK**

**PATCH /api/v1/admin/productos/{id}/toggle (activate/deactivate) — 200 OK**

**Acceptance criteria:**
- [ ] Returns 403 with `ACCESO_DENEGADO` if the role is not `ADMIN`
- [ ] `GET` returns all products including inactive ones (unlike SPEC-BE-001 which only returns active ones)
- [ ] `POST` returns 409 with `PRODUCTO_DUPLICADO` if an active product with the same name already exists
- [ ] `PATCH /toggle` toggles the `activo` field — an inactive product does not appear in cashier searches
- [ ] `PUT` validates that the price is positive — returns 400 with `VALIDACION_FALLIDA` if not

---

### SPEC-BE-011 — End-of-day report (Admin)

**ID:** SPEC-BE-011
**Module:** Reports
**Endpoint:** `GET /api/v1/reportes/cierre?fechaDesde={date}&fechaHasta={date}`
**Related frontend spec:** SPEC-013
**Required role:** `ADMIN`

**Request:**
```http
GET /api/v1/reportes/cierre?fechaDesde=2025-01-15&fechaHasta=2025-01-15
```

**Success response — 200 OK:**
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

**Acceptance criteria:**
- [ ] Returns 403 with `ACCESO_DENEGADO` if the role is not `ADMIN`
- [ ] `montoNeto = montoTotal - montoDevuelto`
- [ ] If there are no sales in the range, returns 200 with all amounts at 0 and empty arrays
- [ ] `fechaDesde` cannot be later than `fechaHasta` — returns 400 with `VALIDACION_FALLIDA`
- [ ] The endpoint also accepts `Accept: text/csv` to export directly as CSV
