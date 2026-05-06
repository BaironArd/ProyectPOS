# Especificaciones del Sistema — Frontend POS
**Versión:** 1.3
**Enfoque:** Spec-Driven Development (SDD) — Capa de UI
**Alcance:** Frontend únicamente. Las specs describen contratos observables en la interfaz, independientes de cualquier implementación backend.

---

## 1. Principios Spec-Driven aplicados

En SDD cada especificación es un **contrato verificable**: define una condición de entrada, una transformación esperada y un resultado observable. No describe *cómo* se implementa, sino *qué* debe ocurrir.

Cada spec en este documento sigue la estructura canónica:

| Campo | Descripción |
|---|---|
| **ID** | Identificador único y trazable |
| **Precondición** | Estado de UI antes del evento |
| **Evento** | Acción del usuario o del sistema |
| **Postcondición** | Estado de UI después del evento |
| **Render esperado** | Elementos visuales verificables |
| **Criterio de aceptación** | Condición booleana que confirma el cumplimiento |

---

## 2. Contexto del sistema

Sistema POS (Point of Sale) manejado por cajeros y administradores. La interfaz permite:

- **Cajero:** buscar productos, construir carrito, procesar pagos (efectivo, tarjeta, transferencia, mixto), confirmar ventas, imprimir recibos, consultar historial del turno, procesar devoluciones
- **Administrador:** gestionar catálogo de productos (crear, editar, desactivar), consultar reportes de cierre de caja, gestionar usuarios y roles
- **Ambos roles:** autenticarse con usuario y contraseña, cerrar sesión

---

## 3. Modelo de estados de UI

El sistema opera como una **máquina de estados finita**. Solo un estado puede estar activo a la vez.

```
┌─────────────────────────────────────────────────────┐
│                   ESTADOS DE UI                      │
├──────────────────┬──────────────────────────────────┤
│ IDLE             │ Estado inicial. Sin actividad.    │
│ BUSCANDO         │ Query enviada, esperando datos.   │
│ RESULTADOS       │ Productos visibles en pantalla.   │
│ CARRITO_ACTIVO   │ ≥1 producto en el carrito.        │
│ CALCULANDO_PAGO  │ Usuario ingresando monto.         │
│ PROCESANDO       │ Confirmación en curso.            │
│ VENTA_COMPLETA   │ Venta confirmada exitosamente.    │
│ HISTORIAL        │ Listado de ventas del turno.      │
│ LOGIN            │ Pantalla de autenticación.        │
│ DEVOLUCION       │ Flujo de devolución activo.       │
│ INVENTARIO       │ Gestión de catálogo (admin).      │
│ REPORTES         │ Reportes de cierre (admin).       │
│ ERROR            │ Fallo recuperable en cualquier    │
│                  │ etapa del flujo.                  │
└──────────────────┴──────────────────────────────────┘
```

**Transiciones válidas:**

```
[sin sesión] → LOGIN → IDLE  (autenticación exitosa)
IDLE → BUSCANDO → RESULTADOS → CARRITO_ACTIVO
CARRITO_ACTIVO → CALCULANDO_PAGO → PROCESANDO → VENTA_COMPLETA
VENTA_COMPLETA → IDLE
CARRITO_ACTIVO → RESULTADOS  (cuando el carrito queda vacío)
IDLE → HISTORIAL → IDLE
RESULTADOS → HISTORIAL → RESULTADOS
VENTA_COMPLETA → DEVOLUCION → IDLE  (cajero inicia devolución)
IDLE → INVENTARIO → IDLE  (solo rol ADMIN)
IDLE → REPORTES → IDLE   (solo rol ADMIN)
* → ERROR → IDLE  (desde cualquier estado autenticado)
IDLE → LOGIN  (cierre de sesión)
```

---

## 4. Especificaciones

---

### SPEC-001 — Búsqueda de productos

**ID:** SPEC-001
**Módulo:** Búsqueda

**Precondición:**
```json
{
  "estado": "IDLE",
  "query": "",
  "productos": []
}
```

**Evento:** Usuario escribe ≥2 caracteres en el campo de búsqueda.

**Postcondición (durante carga):**
```json
{
  "estado": "BUSCANDO",
  "query": "mouse",
  "productos": []
}
```

**Postcondición (resultados disponibles):**
```json
{
  "estado": "RESULTADOS",
  "query": "mouse",
  "productos": [
    { "id": 1, "nombre": "Mouse Óptico", "precio": 30000, "stock": 15 }
  ]
}
```

**Render esperado:**
- Campo de búsqueda muestra el texto ingresado
- Indicador de carga visible mientras `estado === "BUSCANDO"`
- Lista de productos visible cuando `estado === "RESULTADOS"`
- Cada ítem muestra: nombre, precio formateado, botón "Agregar"
- La página **no se recarga**

**Criterios de aceptación:**
- [ ] La búsqueda no se dispara con menos de 2 caracteres
- [ ] El indicador de carga desaparece cuando llegan los resultados
- [ ] Si no hay resultados, se muestra el mensaje: *"Sin resultados para '[query]'"*
- [ ] El estado pasa a `ERROR` si la fuente de datos falla

---

### SPEC-002 — Agregar producto al carrito

**ID:** SPEC-002
**Módulo:** Carrito

**Precondición:**
```json
{
  "estado": "RESULTADOS",
  "carrito": []
}
```

**Evento:** Usuario hace clic en "Agregar" sobre un producto.

**Postcondición:**
```json
{
  "estado": "CARRITO_ACTIVO",
  "carrito": [
    {
      "productoId": 1,
      "nombre": "Mouse Óptico",
      "cantidad": 1,
      "precioUnitario": 30000,
      "subtotal": 30000
    }
  ]
}
```

**Render esperado:**
- Producto aparece en la tabla del carrito
- Columnas visibles: Nombre, Precio unitario, Cantidad, Subtotal, Eliminar
- El total del carrito se actualiza inmediatamente
- El badge del carrito (contador) refleja el número de ítems

**Criterios de aceptación:**
- [ ] Agregar el mismo producto incrementa `cantidad` en 1, no crea una fila nueva
- [ ] `subtotal = precioUnitario × cantidad` siempre
- [ ] El estado cambia de `RESULTADOS` a `CARRITO_ACTIVO` al agregar el primer ítem
- [ ] El botón "Agregar" se desactiva si `stock === 0`

---

### SPEC-003 — Modificar cantidad en el carrito

**ID:** SPEC-003
**Módulo:** Carrito

**Precondición:**
```json
{
  "estado": "CARRITO_ACTIVO",
  "carrito": [{ "productoId": 1, "cantidad": 2, "subtotal": 60000 }]
}
```

**Evento A — Incrementar:** Usuario hace clic en "+" o escribe una cantidad mayor.

**Postcondición A:**
```json
{
  "estado": "CARRITO_ACTIVO",
  "carrito": [{ "productoId": 1, "cantidad": 3, "subtotal": 90000 }]
}
```

**Evento B — Decrementar a 0:** Usuario reduce la cantidad a 0.

**Postcondición B:**
```json
{
  "estado": "RESULTADOS",
  "carrito": []
}
```

> Cuando el carrito queda vacío como resultado de reducir la cantidad a 0, el estado transiciona de `CARRITO_ACTIVO` a `RESULTADOS`.

**Criterios de aceptación:**
- [ ] `subtotal` se recalcula en cada cambio de cantidad
- [ ] Cantidad = 0 elimina el ítem del carrito sin confirmación adicional
- [ ] No se permiten cantidades negativas ni no numéricas
- [ ] Si el carrito queda vacío, el estado regresa a `RESULTADOS`

---

### SPEC-004 — Cálculo de impuesto y total

**ID:** SPEC-004
**Módulo:** Resumen de compra

**Precondición:**
```json
{
  "estado": "CARRITO_ACTIVO",
  "carrito": [{ "subtotal": 100000 }]
}
```

**Transformación (cálculo interno de UI):**

| Campo | Fórmula | Valor ejemplo |
|---|---|---|
| `subtotal` | Σ subtotales de ítems | 100 000 |
| `iva` | `subtotal × 0.19` redondeado al peso | 19 000 |
| `total` | `subtotal + iva` | 119 000 |

**Render esperado:**
```
Subtotal:   $100.000
IVA (19%):   $19.000
─────────────────────
Total:      $119.000
```

**Criterios de aceptación:**
- [ ] Los valores se actualizan en tiempo real al modificar el carrito
- [ ] Los montos se muestran formateados con separador de miles (punto) y prefijo `$` — ejemplo: `$100.000`
- [ ] El bloque de resumen es de solo lectura para el usuario

---

### SPEC-005 — Ingreso de monto de pago y cálculo de cambio

**ID:** SPEC-005
**Módulo:** Panel de pago

**Precondición:**
```json
{
  "estado": "CARRITO_ACTIVO",
  "total": 119000
}
```

**Evento:** Usuario hace clic en "Proceder al pago" e ingresa un monto.

**Postcondición:**
```json
{
  "estado": "CALCULANDO_PAGO",
  "montoPagado": 120000,
  "cambio": 1000
}
```

**Transformación:**

```
cambio = montoPagado − total
```

**Render esperado:**
- Campo de entrada para el monto recibido
- Cambio calculado y visible en tiempo real mientras el usuario escribe
- Si `montoPagado < total`: cambio en rojo con etiqueta *"Monto insuficiente"*
- Si `montoPagado >= total`: cambio en verde

**Criterios de aceptación:**
- [ ] El campo solo acepta valores numéricos positivos
- [ ] El botón "Confirmar venta" está desactivado si `montoPagado < total`
- [ ] El cambio refleja el valor actual del campo en cada modificación del usuario

---

### SPEC-006 — Confirmación de venta

**ID:** SPEC-006
**Módulo:** Confirmación

**Precondición:**
```json
{
  "estado": "CALCULANDO_PAGO",
  "montoPagado": 120000,
  "total": 119000
}
```

**Evento:** Usuario hace clic en "Confirmar venta".

**Postcondición (en proceso):**
```json
{ "estado": "PROCESANDO" }
```

**Postcondición (éxito):**
```json
{
  "estado": "VENTA_COMPLETA",
  "carrito": [],
  "query": "",
  "montoPagado": 0,
  "cambio": 0
}
```

**Render esperado:**
- Spinner o feedback visual mientras `estado === "PROCESANDO"`
- Mensaje de éxito: *"¡Venta completada! Cambio: $X.XXX"*
- El carrito se vacía visualmente
- El sistema regresa a `IDLE` tras 3 segundos o al hacer clic en "Nueva venta"

**Criterios de aceptación:**
- [ ] El botón "Confirmar" no puede presionarse dos veces (se desactiva al primer clic)
- [ ] El carrito y todos los campos se limpian al completar la venta
- [ ] Si la confirmación falla → estado pasa a `ERROR` con mensaje descriptivo

---

### SPEC-007 — Manejo de errores

**ID:** SPEC-007
**Módulo:** Transversal

**Precondición:** Cualquier estado del flujo.

**Evento:** Fallo en la carga de datos, timeout o error de validación.

**Postcondición:**
```json
{
  "estado": "ERROR",
  "error": {
    "codigo": "LOAD_FAILED",
    "mensaje": "No se pudieron cargar los productos. Intenta nuevamente."
  }
}
```

**Render esperado:**
- Banner de error visible en la parte superior de la pantalla
- Mensaje descriptivo (no técnico)
- Botón "Reintentar" que restaura el último evento

**Criterios de aceptación:**
- [ ] El error no colapsa la interfaz — el resto del UI sigue visible
- [ ] El banner se puede cerrar manualmente
- [ ] Cada tipo de error tiene un mensaje diferenciado (no un mensaje genérico único)

---

### SPEC-008 — Historial de ventas del turno

**ID:** SPEC-008
**Módulo:** Historial

**Precondición:**
```json
{
  "estado": "IDLE",
  "historial": []
}
```

**Evento:** Usuario hace clic en "Ver historial" desde cualquier estado no transaccional (`IDLE` o `RESULTADOS`).

**Postcondición:**
```json
{
  "estado": "HISTORIAL",
  "historial": [
    {
      "ventaId": "VNT-20250115-001",
      "fechaHora": "2025-01-15T10:30:00Z",
      "total": 136850,
      "cantidadItems": 3
    }
  ]
}
```

**Render esperado:**
- Lista de ventas del turno con: `ventaId`, fecha/hora formateada, total formateado, cantidad de ítems
- Botón "Volver" que regresa al estado anterior (`IDLE` o `RESULTADOS`)
- Si no hay ventas, se muestra: *"No hay ventas registradas en este turno"*

**Criterios de aceptación:**
- [ ] El historial se carga al entrar al estado `HISTORIAL` invocando `IVentaHistorialPort.listar()`
- [ ] Cada fila muestra `ventaId`, fecha/hora, total formateado con prefijo `$` y separador de miles, y cantidad de ítems
- [ ] Si la carga falla, el estado pasa a `ERROR` con código `HISTORIAL_NO_DISPONIBLE`
- [ ] El botón "Volver" regresa al estado previo sin perder el carrito activo si lo había

---

### SPEC-009 — Autenticación de usuario (Login)

**ID:** SPEC-009
**Módulo:** Autenticación

**Precondición:**
```json
{ "sesion": null, "estado": "LOGIN" }
```

**Evento:** Usuario ingresa credenciales válidas y hace clic en "Ingresar".

**Postcondición:**
```json
{
  "sesion": {
    "usuario": "cajero01",
    "rol": "CAJERO",
    "token": "eyJhbGci..."
  },
  "estado": "IDLE"
}
```

**Render esperado:**
- Pantalla de login centrada con campos "Usuario" y "Contraseña"
- Botón "Ingresar" desactivado si algún campo está vacío
- Spinner visible mientras se validan las credenciales
- Si las credenciales son incorrectas: mensaje *"Usuario o contraseña incorrectos"*
- Tras login exitoso: la pantalla principal del POS es visible según el rol

**Criterios de aceptación:**
- [ ] El botón "Ingresar" está desactivado si usuario o contraseña están vacíos
- [ ] Credenciales incorrectas muestran mensaje de error sin revelar cuál campo es incorrecto
- [ ] Login exitoso con rol `CAJERO` muestra la pantalla de ventas (IDLE)
- [ ] Login exitoso con rol `ADMIN` muestra la pantalla de ventas con acceso adicional a Inventario y Reportes
- [ ] El token JWT se almacena en memoria (no en localStorage) y se envía en cada petición
- [ ] Si la sesión expira, el sistema redirige automáticamente a LOGIN

---

### SPEC-010 — Cierre de sesión

**ID:** SPEC-010
**Módulo:** Autenticación

**Precondición:**
```json
{ "sesion": { "usuario": "cajero01", "rol": "CAJERO" }, "estado": "IDLE" }
```

**Evento:** Usuario hace clic en "Cerrar sesión".

**Postcondición:**
```json
{ "sesion": null, "estado": "LOGIN" }
```

**Criterios de aceptación:**
- [ ] El token JWT se elimina de memoria al cerrar sesión
- [ ] El estado de la aplicación se resetea completamente (carrito, query, historial)
- [ ] La pantalla de login es visible inmediatamente tras el cierre
- [ ] No es posible navegar de vuelta al POS con el botón "Atrás" del navegador tras cerrar sesión

---

### SPEC-011 — Devolución de venta

**ID:** SPEC-011
**Módulo:** Devoluciones

**Precondición:**
```json
{
  "estado": "VENTA_COMPLETA",
  "ventaId": "VNT-20250115-001"
}
```

**Evento:** Cajero hace clic en "Devolver venta" desde la pantalla de venta completada o desde el historial.

**Postcondición (devolución procesada):**
```json
{
  "estado": "IDLE",
  "devolucion": {
    "ventaId": "VNT-20250115-001",
    "montoDevuelto": 136850,
    "estado": "DEVUELTA"
  }
}
```

**Render esperado:**
- Panel de confirmación con el resumen de la venta a devolver
- Monto a devolver al cliente visible y formateado
- Botón "Confirmar devolución" y botón "Cancelar"
- Mensaje de éxito: *"Devolución procesada. Devolver $X.XXX al cliente."*

**Criterios de aceptación:**
- [ ] Solo se puede devolver una venta con estado `COMPLETADA`
- [ ] El panel muestra el resumen completo de la venta antes de confirmar
- [ ] Al confirmar, el stock de los productos se restaura
- [ ] La venta queda con estado `DEVUELTA` en el sistema
- [ ] No se puede devolver la misma venta dos veces
- [ ] Si la devolución falla, el estado pasa a `ERROR` con mensaje descriptivo

---

### SPEC-012 — Gestión de inventario (Admin)

**ID:** SPEC-012
**Módulo:** Inventario (solo rol ADMIN)

**Precondición:**
```json
{ "sesion": { "rol": "ADMIN" }, "estado": "IDLE" }
```

**Evento:** Administrador hace clic en "Inventario".

**Postcondición:**
```json
{
  "estado": "INVENTARIO",
  "productos": [
    { "id": 1, "nombre": "Mouse Óptico", "precio": 30000, "stock": 15, "activo": true }
  ]
}
```

**Render esperado:**
- Tabla de todos los productos con: nombre, precio, stock actual, estado (activo/inactivo)
- Botón "Nuevo producto" para crear
- Botón "Editar" por fila
- Botón "Desactivar/Activar" por fila (no elimina, solo oculta del catálogo)
- Formulario modal para crear/editar con campos: nombre, precio, stock inicial, categoría

**Criterios de aceptación:**
- [ ] Solo usuarios con rol `ADMIN` pueden acceder al estado `INVENTARIO`
- [ ] Un cajero que intente acceder a INVENTARIO recibe error `ACCESO_DENEGADO`
- [ ] Crear un producto con nombre duplicado retorna error `PRODUCTO_DUPLICADO`
- [ ] El precio debe ser un número positivo — campo inválido bloquea el botón "Guardar"
- [ ] Desactivar un producto lo oculta de los resultados de búsqueda del cajero
- [ ] Los cambios de stock se reflejan en tiempo real en la tabla

---

### SPEC-013 — Reportes de cierre de caja (Admin)

**ID:** SPEC-013
**Módulo:** Reportes (solo rol ADMIN)

**Precondición:**
```json
{ "sesion": { "rol": "ADMIN" }, "estado": "IDLE" }
```

**Evento:** Administrador hace clic en "Reportes" y selecciona un rango de fechas.

**Postcondición:**
```json
{
  "estado": "REPORTES",
  "reporte": {
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
  }
}
```

**Render esperado:**
- Selector de rango de fechas (desde / hasta)
- Resumen: total de ventas, total devueltas, monto bruto, monto devuelto, monto neto
- Tabla de ventas por cajero
- Botón "Exportar CSV"

**Criterios de aceptación:**
- [ ] Solo usuarios con rol `ADMIN` pueden acceder al estado `REPORTES`
- [ ] El reporte se genera al seleccionar el rango de fechas y hacer clic en "Generar"
- [ ] Los montos se muestran formateados con prefijo `$` y separador de miles
- [ ] El botón "Exportar CSV" descarga un archivo con los datos del reporte
- [ ] Si no hay ventas en el rango, se muestra *"Sin ventas en el período seleccionado"*

---

### SPEC-014 — Múltiples métodos de pago

**ID:** SPEC-014
**Módulo:** Panel de pago

**Precondición:**
```json
{
  "estado": "CALCULANDO_PAGO",
  "total": 119000,
  "metodoPago": null
}
```

**Evento:** Cajero selecciona un método de pago e ingresa los montos.

**Postcondición (pago mixto: efectivo + tarjeta):**
```json
{
  "estado": "CALCULANDO_PAGO",
  "metodoPago": "MIXTO",
  "pagos": [
    { "metodo": "EFECTIVO", "monto": 70000 },
    { "metodo": "TARJETA", "monto": 49000 }
  ],
  "totalPagado": 119000,
  "cambio": 0
}
```

**Métodos disponibles:** `EFECTIVO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`, `TRANSFERENCIA`, `MIXTO`

**Render esperado:**
- Selector de método de pago con íconos
- Para `EFECTIVO`: campo de monto con cálculo de cambio (igual que SPEC-005)
- Para `TARJETA_DEBITO` / `TARJETA_CREDITO` / `TRANSFERENCIA`: campo de referencia de transacción (opcional)
- Para `MIXTO`: múltiples filas de pago, cada una con método y monto; la suma debe cubrir el total
- Indicador visual cuando la suma de pagos cubre el total

**Criterios de aceptación:**
- [ ] El método `EFECTIVO` mantiene el comportamiento de SPEC-005 (cambio en tiempo real)
- [ ] Para métodos no-efectivo, el botón "Confirmar" se habilita cuando el monto ingresado = total
- [ ] Para `MIXTO`, la suma de todos los pagos debe ser ≥ total para habilitar "Confirmar"
- [ ] El cambio solo aplica cuando hay componente de efectivo en el pago
- [ ] El método de pago seleccionado se incluye en la respuesta de confirmación y en el recibo

---

### SPEC-015 — Impresión de recibo

**ID:** SPEC-015
**Módulo:** Recibo

**Precondición:**
```json
{
  "estado": "VENTA_COMPLETA",
  "ventaId": "VNT-20250115-001"
}
```

**Evento:** Cajero hace clic en "Imprimir recibo".

**Postcondición:** El estado no cambia. Se abre el diálogo de impresión del navegador.

**Render del recibo:**
```
─────────────────────────────
        PUNTO DE VENTA
─────────────────────────────
Fecha: 15/01/2025  10:30
Cajero: cajero01
Venta: VNT-20250115-001
─────────────────────────────
Mouse Óptico USB    x2  $60.000
Teclado Mecánico    x1  $55.000
─────────────────────────────
Subtotal:          $115.000
IVA (19%):          $21.850
─────────────────────────────
TOTAL:             $136.850
─────────────────────────────
Pago: Efectivo     $150.000
Cambio:             $13.150
─────────────────────────────
     ¡Gracias por su compra!
─────────────────────────────
```

**Criterios de aceptación:**
- [ ] El recibo incluye: nombre del negocio, fecha/hora, cajero, ID de venta, ítems, subtotal, IVA, total, método de pago y cambio
- [ ] El botón "Imprimir recibo" está disponible en el estado `VENTA_COMPLETA`
- [ ] El recibo se genera usando `window.print()` con estilos CSS de impresión (`@media print`)
- [ ] El recibo es legible en papel de 80mm (formato ticket)
- [ ] Si el método de pago no es efectivo, la línea de cambio no aparece en el recibo

---

## 5. Matriz de trazabilidad

| Spec | Evento de usuario | Estado resultante | Componente responsable |
|---|---|---|---|
| SPEC-001 | Escribir en búsqueda | BUSCANDO → RESULTADOS | `SearchBar`, `ProductList` |
| SPEC-002 | Clic en "Agregar" | RESULTADOS → CARRITO_ACTIVO | `ProductList`, `Cart` |
| SPEC-003 | Cambiar cantidad | CARRITO_ACTIVO / RESULTADOS | `Cart` |
| SPEC-004 | Automático (reactivo) | CARRITO_ACTIVO | `OrderSummary` |
| SPEC-005 | Ingresar monto | CALCULANDO_PAGO | `PaymentPanel` |
| SPEC-006 | Clic en "Confirmar" | PROCESANDO → VENTA_COMPLETA | `PaymentPanel`, `AppState` |
| SPEC-007 | Error de sistema | ERROR | `ErrorBanner`, `AppState` |
| SPEC-008 | Clic en "Ver historial" | HISTORIAL | `SalesHistory` |
| SPEC-009 | Cargar pantalla sin sesión | LOGIN | `LoginForm` |
| SPEC-010 | Clic en "Cerrar sesión" | LOGIN | `Header` |
| SPEC-011 | Clic en "Devolver venta" | DEVOLUCION | `RefundPanel` |
| SPEC-012 | Clic en "Inventario" (admin) | INVENTARIO | `InventoryPanel` |
| SPEC-013 | Clic en "Reportes" (admin) | REPORTES | `ReportsPanel` |
| SPEC-014 | Seleccionar método de pago | CALCULANDO_PAGO | `PaymentPanel` |
| SPEC-015 | Clic en "Imprimir recibo" | VENTA_COMPLETA | `ReceiptButton` |
