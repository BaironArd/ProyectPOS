# Plan de Tareas — Frontend POS
**Versión:** 1.3  
**Referencias:** especificaciones.md v1.3 · diseno.md v1.3  
**Metodología:** Spec-Driven Development — cada tarea implementa y verifica una spec

---

## 1. Principio de trazabilidad

En SDD una tarea está **completa** únicamente cuando todos los criterios de aceptación de su spec asociada son verificables. El criterio no es "el código está escrito", sino "la spec pasa".

Cada tarea tiene:
- **Spec(s) que implementa** (enlace directo)
- **Entregable concreto** (qué debe existir al terminar)
- **Criterios de aceptación** (verificación de la spec en UI)
- **Estimación** (en horas de desarrollo frontend)

---

## 2. Stack tecnológico y entorno de desarrollo

### 2.1 Herramientas requeridas

| Herramienta | Versión | Propósito |
|---|---|---|
| Node.js | 20 LTS | Runtime de JavaScript |
| npm | 10.x | Gestor de paquetes |
| Vite | 5.x | Bundler y servidor de desarrollo |
| React | 18.x | Framework de UI |
| TypeScript | 5.x | Tipado estático |
| Zustand | 4.x | Estado global |
| Vitest | 1.x | Framework de tests unitarios |
| React Testing Library | 14.x | Tests de integración de UI |
| fast-check | 3.x | Property-Based Testing |
| ESLint | 8.x | Linter de código |
| Prettier | 3.x | Formateador de código |

### 2.2 Inicialización del proyecto

```bash
npm create vite@latest pos-frontend -- --template react-ts
cd pos-frontend
npm install
npm install zustand
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D fast-check
npm install -D eslint prettier eslint-config-prettier
```

### 2.3 Configuración de Vitest (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**'],
      thresholds: { lines: 100, functions: 100, branches: 100 }
    }
  }
})
```

### 2.4 Configuración de TypeScript (`tsconfig.json` — fragmento clave)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@domain/*": ["./src/domain/*"],
      "@application/*": ["./src/application/*"],
      "@infrastructure/*": ["./src/infrastructure/*"],
      "@ui/*": ["./src/ui/*"]
    }
  }
}
```

### 2.5 Variables de entorno (`.env.development`)

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_APP_NAME=Punto de Venta
```

### 2.6 Scripts disponibles (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src"
  }
}
```

### 2.7 Criterio de "entorno listo"

- [ ] `npm run dev` levanta la app en `http://localhost:5173` sin errores
- [ ] `npm run test` ejecuta todos los tests y reporta resultados
- [ ] `npm run build` compila sin errores de TypeScript
- [ ] `npm run lint` no reporta errores en ningún archivo de `src/`

---

## 3. Resumen de tareas

| ID | Nombre | Spec(s) | Estimación | Prioridad |
|---|---|---|---|---|
| T-01 | Scaffolding y dominio base | — | 2h | Alta |
| T-02 | Store de estado centralizado | Todos | 3h | Alta |
| T-03 | Búsqueda de productos | SPEC-001 | 3h | Alta |
| T-04 | Listado y agregar al carrito | SPEC-002 | 3h | Alta |
| T-05 | Modificar y eliminar ítems | SPEC-003 | 2h | Alta |
| T-06 | Resumen de compra con IVA | SPEC-004 | 2h | Alta |
| T-07 | Panel de pago y cambio | SPEC-005 | 3h | Alta |
| T-08 | Confirmación de venta | SPEC-006 | 3h | Alta |
| T-09 | Manejo de errores global | SPEC-007 | 2h | Media |
| T-10a | Tests unitarios de calculadora | SPEC-004, SPEC-005 | 1h | Media |
| T-10b | Tests unitarios del store | T-02 (transiciones) | 1h | Media |
| T-10c | Property-Based Testing calculadora | SPEC-004, SPEC-005 | 2h | Media |
| T-11 | Tests de integración UI | SPEC-001 al 015 | 6h | Media |
| T-12 | Historial de ventas | SPEC-008 | 3h | Media |
| T-13 | Autenticación y sesión | SPEC-009, SPEC-010 | 4h | Alta |
| T-14 | Devoluciones | SPEC-011 | 3h | Alta |
| T-15 | Gestión de inventario (Admin) | SPEC-012 | 4h | Alta |
| T-16 | Reportes de cierre de caja (Admin) | SPEC-013 | 3h | Alta |
| T-17 | Múltiples métodos de pago | SPEC-014 | 4h | Alta |
| T-18 | Impresión de recibos | SPEC-015 | 2h | Media |

**Total estimado:** ~52 horas de desarrollo frontend

---

## 4. Tareas detalladas

---

### T-01 — Scaffolding y dominio base

**Descripción:** Crear la estructura del proyecto y los tipos de dominio que todas las tareas posteriores consumen.

**Entregables:**
- Proyecto React + TypeScript inicializado (`vite` o `create-react-app`)
- Dependencias instaladas: `zustand`, `xstate` (opcional), `vitest`
- Archivos de tipos: `domain/types/POSState.ts`, `domain/types/Producto.ts`, `domain/types/Carrito.ts`
- Archivos de puertos: `domain/ports/IProductoPort.ts`, `domain/ports/IVentaPort.ts`
- Archivo `domain/calculadora.ts` con funciones puras

**Criterios de aceptación:**
- [ ] El proyecto compila sin errores de TypeScript
- [ ] Los tipos del dominio reflejan exactamente los modelos definidos en `diseno.md §5`
- [ ] `calculadora.ts` exporta `calcularResumen`, `calcularCambio`, `calcularSubtotal`
- [ ] Los puertos `IProductoPort` e `IVentaPort` están definidos en `domain/ports/` (no en infraestructura)

**Dependencias previas:** Ninguna  
**Estimación:** 2h

---

### T-02 — Store de estado centralizado

**Descripción:** Implementar el store global con Zustand que gestiona la máquina de estados de UI.

**Entregables:**
- `usePOSStore.ts` con estado inicial y acciones:
  - `setQuery`, `setProductos`, `setEstado`
  - `agregarAlCarrito`, `modificarCantidad`, `eliminarDelCarrito`
  - `setMontoPagado`, `confirmarVenta`, `resetVenta`
  - `setError`, `clearError`
- Transiciones de estado válidas según `diseno.md §3`

**Criterios de aceptación:**
- [ ] El estado inicial es `{ estado: 'IDLE', carrito: [], query: '', ... }`
- [ ] Las transiciones inválidas (ej. `IDLE → PROCESANDO`) no modifican el estado
- [ ] Cada acción actualiza exactamente los campos definidos en su spec
- [ ] La transición `CARRITO_ACTIVO → RESULTADOS` se activa automáticamente cuando el carrito queda vacío

**Dependencias previas:** T-01  
**Estimación:** 3h

---

### T-03 — Búsqueda de productos (SPEC-001)

**Spec:** SPEC-001

**Descripción:** Implementar el componente `SearchBar` y el hook `useSearch`, con debounce y gestión de estado de carga.

**Entregables:**
- Componente `SearchBar` con campo de texto controlado
- Hook `useSearch(query)` que invoca `IProductoPort.buscar()` (depende del puerto, no del adaptador)
- Adaptador mock `productos.mock.ts` con datos de prueba
- Estado `BUSCANDO` activo mientras se espera respuesta
- Componente `LoadingSpinner` integrado en `SearchBar`

**Criterios de aceptación (verificables en UI):**
- [ ] La búsqueda no se dispara con menos de 2 caracteres (SPEC-001)
- [ ] El spinner es visible exactamente mientras `estado === 'BUSCANDO'`
- [ ] Al obtener resultados, el estado pasa a `RESULTADOS` y el spinner desaparece
- [ ] Si no hay resultados, se muestra *"Sin resultados para 'X'"* (SPEC-001)
- [ ] La página no se recarga en ningún momento (SPEC-001)

**Dependencias previas:** T-01, T-02  
**Estimación:** 3h

---

### T-04 — Listado de productos y agregar al carrito (SPEC-002)

**Spec:** SPEC-002

**Descripción:** Implementar `ProductList`, `ProductCard` y la acción `agregarAlCarrito` en el store.

**Entregables:**
- Componente `ProductList` que renderiza la lista de `productos` del store
- Componente `ProductCard` con: nombre, precio formateado, botón "Agregar"
- Componente `Cart` con tabla dinámica de ítems
- Componente `CartBadge` en el header con contador de ítems

**Criterios de aceptación:**
- [ ] Agregar el mismo producto dos veces muestra `cantidad: 2`, no dos filas (SPEC-002)
- [ ] `subtotal = precioUnitario × cantidad` visible en cada fila (SPEC-002)
- [ ] El estado cambia de `RESULTADOS` a `CARRITO_ACTIVO` al agregar el primer ítem (SPEC-002)
- [ ] El botón "Agregar" está desactivado si `stock === 0` (SPEC-002)
- [ ] `CartBadge` refleja el número de ítems únicos en el carrito (SPEC-002)

**Dependencias previas:** T-02, T-03  
**Estimación:** 3h

---

### T-05 — Modificar y eliminar ítems del carrito (SPEC-003)

**Spec:** SPEC-003

**Descripción:** Implementar los controles de cantidad dentro de `CartRow` y la lógica de eliminación automática.

**Entregables:**
- Control de cantidad (`+` / `-` / input numérico) en cada `CartRow`
- Botón de eliminar explícito por fila
- Lógica: cantidad = 0 → eliminar automáticamente
- Lógica: carrito vacío → estado vuelve a `RESULTADOS`

**Criterios de aceptación:**
- [ ] Al cambiar la cantidad, `subtotal` de esa fila se actualiza inmediatamente (SPEC-003)
- [ ] Reducir cantidad a 0 elimina la fila sin diálogo de confirmación (SPEC-003)
- [ ] No es posible ingresar cantidades negativas o texto (SPEC-003)
- [ ] Si el carrito queda vacío, el estado regresa a `RESULTADOS` (SPEC-003)

**Dependencias previas:** T-04  
**Estimación:** 2h

---

### T-06 — Resumen de compra con IVA (SPEC-004)

**Spec:** SPEC-004

**Descripción:** Implementar el componente `OrderSummary` que consume `calcularResumen` y se actualiza reactivamente.

**Entregables:**
- Componente `OrderSummary` de solo lectura
- Líneas visibles: Subtotal, IVA (19%), Total
- Conexión reactiva al store: se recalcula en cada cambio del carrito

**Criterios de aceptación:**
- [ ] Los tres valores se actualizan en tiempo real al modificar cantidades (SPEC-004)
- [ ] Los montos muestran formato: `$100.000` (separador de miles = punto, prefijo `$`) (SPEC-004)
- [ ] El usuario no puede editar ningún campo del resumen (SPEC-004)
- [ ] `iva = subtotal × 0.19` redondeado al peso (SPEC-004)

**Dependencias previas:** T-01, T-05  
**Estimación:** 2h

---

### T-07 — Panel de pago y cálculo de cambio (SPEC-005)

**Spec:** SPEC-005

**Descripción:** Implementar `PaymentPanel` con campo de monto y visualización dinámica del cambio.

**Entregables:**
- Componente `PaymentPanel` visible al hacer clic en "Proceder al pago"
- Campo `MontoInput` (solo números positivos)
- Componente `CambioDisplay` con indicador visual (rojo/verde)
- Hook `usePayment` que consume `calcularCambio`

**Criterios de aceptación:**
- [ ] El cambio refleja el valor actual del campo en cada modificación del usuario (SPEC-005)
- [ ] Si `montoPagado < total`: texto en rojo + etiqueta *"Monto insuficiente"* (SPEC-005)
- [ ] Si `montoPagado >= total`: cambio en verde (SPEC-005)
- [ ] El botón "Confirmar venta" está `disabled` si `montoPagado < total` (SPEC-005)
- [ ] Solo se permiten valores numéricos positivos en el campo (SPEC-005)

**Dependencias previas:** T-06  
**Estimación:** 3h

---

### T-08 — Confirmación de venta (SPEC-006)

**Spec:** SPEC-006

**Descripción:** Implementar el flujo completo de confirmación: loading, éxito, limpieza y retorno a IDLE.

**Entregables:**
- Acción `confirmarVenta` en el store (llama a `IVentaPort.confirmar()` — depende del puerto)
- Adaptador mock `venta.mock.ts`
- Feedback visual de `PROCESANDO` (spinner en botón o overlay)
- Mensaje de éxito con el cambio calculado
- Reset completo del estado tras confirmación

**Criterios de aceptación:**
- [ ] El botón "Confirmar" se desactiva al primer clic y no puede presionarse dos veces (SPEC-006)
- [ ] El spinner es visible mientras `estado === 'PROCESANDO'` (SPEC-006)
- [ ] Al completar, se muestra: *"¡Venta completada! Cambio: $X.XXX"* (SPEC-006)
- [ ] Carrito, query y montos quedan en cero tras la confirmación (SPEC-006)
- [ ] El sistema vuelve a `IDLE` tras 3s o al hacer clic en "Nueva venta" (SPEC-006)
- [ ] Si el adaptador falla, el estado pasa a `ERROR` con mensaje descriptivo (SPEC-006, SPEC-007)

**Dependencias previas:** T-07  
**Estimación:** 3h

---

### T-09 — Manejo de errores global (SPEC-007)

**Spec:** SPEC-007

**Descripción:** Implementar el sistema de errores transversal con `ErrorBanner`.

**Entregables:**
- Componente `ErrorBanner` que se muestra cuando `estado === 'ERROR'`
- Mensajes diferenciados por `error.codigo`
- Botón "Reintentar" que re-ejecuta el último evento
- Botón de cierre manual del banner

**Criterios de aceptación:**
- [ ] El banner es visible en cualquier estado si `estado === 'ERROR'` (SPEC-007)
- [ ] El resto de la interfaz sigue visible y no colapsa (SPEC-007)
- [ ] El mensaje es legible por el usuario (sin stack traces ni errores técnicos) (SPEC-007)
- [ ] Cerrar el banner limpia el error y regresa al estado anterior (SPEC-007)
- [ ] Cada código de error tiene un mensaje único (SPEC-007)

**Dependencias previas:** T-02  
**Estimación:** 2h

---

### T-10a — Tests unitarios de lógica de calculadora

**Specs verificadas:** SPEC-004, SPEC-005

**Descripción:** Tests unitarios para todas las funciones de `calculadora.ts` usando Vitest.

**Entregables:**
- `calculadora.test.ts` con cobertura de:
  - `calcularResumen`: carrito vacío, un ítem, múltiples ítems
  - `calcularCambio`: exacto, con vuelto, monto insuficiente
  - `calcularSubtotal`: precio × cantidad básico

**Criterios de aceptación:**
- [ ] Todos los tests pasan con `vitest run`
- [ ] Cobertura ≥ 100% de `calculadora.ts`
- [ ] Los valores de los tests corresponden exactamente a los ejemplos de las specs

**Dependencias previas:** T-01  
**Estimación:** 1h

---

### T-10c — Property-Based Testing de la calculadora

**Specs verificadas:** SPEC-004, SPEC-005

**Descripción:** Implementar tests basados en propiedades para `calculadora.ts` usando `fast-check` con Vitest. En lugar de casos fijos, se verifican propiedades matemáticas que deben cumplirse para cualquier entrada válida.

**Propiedades a verificar:**

```typescript
// Propiedad 1 — IVA siempre es 19% del subtotal redondeado
∀ subtotal ≥ 0: iva = Math.round(subtotal × 0.19)

// Propiedad 2 — Total siempre es subtotal + iva
∀ subtotal ≥ 0: total = subtotal + Math.round(subtotal × 0.19)

// Propiedad 3 — Cambio es la diferencia exacta
∀ montoPagado, total: cambio = montoPagado - total

// Propiedad 4 — Carrito vacío siempre da subtotal = 0
calcularResumen([]) → { subtotal: 0, iva: 0, total: 0 }

// Propiedad 5 — Subtotal de ítem es precio × cantidad
∀ precio ≥ 0, cantidad ≥ 0: calcularSubtotal(precio, cantidad) = precio × cantidad
```

**Entregables:**
- `calculadora.property.test.ts` usando `fast-check` con al menos 5 propiedades
- Dependencia `fast-check` agregada a `package.json`

**Criterios de aceptación:**
- [ ] Todos los tests de propiedades pasan con `vitest run` ejecutando ≥100 casos aleatorios por propiedad
- [ ] Si una propiedad falla, `fast-check` reporta el contraejemplo mínimo que la rompe
- [ ] Las propiedades no duplican los tests de T-10a — verifican invariantes, no casos específicos
- [ ] La propiedad de IVA cubre el redondeo: `Math.round(subtotal × 0.19)` para valores con decimales

**Dependencias previas:** T-01  
**Estimación:** 2h

---

### T-10b — Tests unitarios del store (transiciones de estado)

**Specs verificadas:** T-02 (máquina de estados)

**Descripción:** Tests unitarios para las transiciones de estado del store `usePOSStore`, verificando que la máquina de estados se comporta según `diseno.md §3`.

**Entregables:**
- `usePOSStore.test.ts` con cobertura de:
  - Transiciones válidas: `IDLE → BUSCANDO`, `RESULTADOS → CARRITO_ACTIVO`, etc.
  - Transiciones inválidas: no modifican el estado (ej. `IDLE → PROCESANDO`)
  - Transición automática `CARRITO_ACTIVO → RESULTADOS` al vaciar el carrito
  - Reset completo tras `confirmarVenta`

**Criterios de aceptación:**
- [ ] Todos los tests pasan con `vitest run`
- [ ] Cada transición válida definida en `diseno.md §3` tiene al menos un test
- [ ] Al menos un test verifica que una transición inválida no modifica el estado
- [ ] La transición automática por carrito vacío está cubierta

**Dependencias previas:** T-02  
**Estimación:** 1h

---

### T-11 — Tests de integración de UI

**Specs verificadas:** SPEC-001 al SPEC-007

**Descripción:** Tests de integración con React Testing Library que verifican el comportamiento observable definido en cada spec.

**Entregables:**
- `SearchBar.test.tsx`: verifica SPEC-001 (mínimo 2 chars, loading, resultados, sin resultados)
- `Cart.test.tsx`: verifica SPEC-002 y SPEC-003 (agregar, modificar, eliminar, carrito vacío → RESULTADOS)
- `OrderSummary.test.tsx`: verifica SPEC-004 (cálculos en tiempo real, formato)
- `PaymentPanel.test.tsx`: verifica SPEC-005 y SPEC-006 (cambio, confirmación, reset)
- `ErrorBanner.test.tsx`: verifica SPEC-007 (visibilidad, cierre, mensajes)
- `SalesHistory.test.tsx`: verifica SPEC-008 (carga, formato, navegación, error)

**Criterios de aceptación:**
- [ ] Cada archivo de test tiene al menos un caso por criterio de aceptación de su spec
- [ ] Todos los tests pasan contra el store con adaptadores mock (inyectados vía `IProductoPort` / `IVentaPort`)
- [ ] Ningún test conoce detalles de implementación (solo interactúa vía DOM)

**Dependencias previas:** T-03 al T-09  
**Estimación:** 4h

---

### T-12 — Historial de ventas (SPEC-008)

**Spec:** SPEC-008

**Descripción:** Implementar el componente `SalesHistory`, el hook `useHistory` y el puerto `IVentaHistorialPort` con su adaptador.

**Entregables:**
- Puerto `domain/ports/IVentaHistorialPort.ts`
- Hook `useHistory()` que invoca `IVentaHistorialPort.listar()` al entrar al estado `HISTORIAL`
- Adaptador `VentaHistorialAdapter.ts` que llama a `GET /api/v1/ventas` (con filtro de turno si aplica)
- Mock `historial.mock.ts` con datos de prueba
- Componente `SalesHistory` con tabla de ventas y botón "Volver"
- Acción `verHistorial` y `volverDeHistorial` en el store (guarda y restaura `estadoPrevio`)

**Criterios de aceptación:**
- [ ] Al entrar a `HISTORIAL`, se invoca `IVentaHistorialPort.listar()` y se muestran los resultados (SPEC-008)
- [ ] Cada fila muestra `ventaId`, fecha/hora formateada, total con prefijo `$` y separador de miles, cantidad de ítems (SPEC-008)
- [ ] Si no hay ventas, se muestra *"No hay ventas registradas en este turno"* (SPEC-008)
- [ ] Si la carga falla, el estado pasa a `ERROR` con código `HISTORIAL_NO_DISPONIBLE` (SPEC-008)
- [ ] El botón "Volver" restaura exactamente el estado previo (`IDLE` o `RESULTADOS`) (SPEC-008)
- [ ] `IVentaHistorialPort` está en `domain/ports/` — no en infraestructura (DIP)

**Dependencias previas:** T-02, T-09  
**Estimación:** 3h

---

### T-13 — Autenticación y sesión (SPEC-009, SPEC-010)

**Specs:** SPEC-009, SPEC-010

**Descripción:** Implementar el flujo completo de login/logout con JWT almacenado en memoria y control de acceso por rol.

**Entregables:**
- Puerto `domain/ports/IAuthPort.ts` con métodos `login` y `logout`
- Hook `useAuth()` que invoca `IAuthPort`
- Adaptador `AuthAdapter.ts` que llama a `POST /api/v1/auth/login` y `POST /api/v1/auth/logout`
- Mock `auth.mock.ts` con usuarios de prueba (cajero01/CAJERO, admin01/ADMIN)
- Componente `LoginForm` con campos usuario/contraseña y botón "Ingresar"
- Acción `login` y `logout` en el store (guarda/limpia `sesion`)
- Guard de rutas: redirige a LOGIN si no hay sesión activa
- Interceptor HTTP que agrega el token JWT en el header `Authorization: Bearer <token>`

**Criterios de aceptación:**
- [ ] El botón "Ingresar" está desactivado si usuario o contraseña están vacíos (SPEC-009)
- [ ] Credenciales incorrectas muestran mensaje de error sin revelar cuál campo es incorrecto (SPEC-009)
- [ ] Login exitoso con rol `CAJERO` muestra la pantalla de ventas (SPEC-009)
- [ ] Login exitoso con rol `ADMIN` muestra botones adicionales de Inventario y Reportes (SPEC-009)
- [ ] El token JWT se almacena en memoria — no en `localStorage` ni `sessionStorage` (SPEC-009)
- [ ] Logout limpia el token y resetea el estado completo (SPEC-010)
- [ ] No es posible navegar al POS con el botón "Atrás" tras cerrar sesión (SPEC-010)

**Dependencias previas:** T-01, T-02
**Estimación:** 4h

---

### T-14 — Devoluciones (SPEC-011)

**Specs:** SPEC-011

**Descripción:** Implementar el flujo de devolución de una venta completada.

**Entregables:**
- Puerto `domain/ports/IDevolucionPort.ts`
- Hook `useRefund(ventaId)` que invoca `IDevolucionPort.procesar()`
- Adaptador `DevolucionAdapter.ts` que llama a `POST /api/v1/ventas/{ventaId}/devolucion`
- Mock `devolucion.mock.ts`
- Componente `RefundPanel` con resumen de la venta y botones "Confirmar devolución" / "Cancelar"
- Botón "Devolver venta" visible en `VENTA_COMPLETA` y en `SalesHistory`

**Criterios de aceptación:**
- [ ] Solo se puede devolver una venta con estado `COMPLETADA` (SPEC-011)
- [ ] El panel muestra el resumen completo antes de confirmar (SPEC-011)
- [ ] Al confirmar, el stock de los productos se restaura (SPEC-011)
- [ ] La venta queda con estado `DEVUELTA` — no se puede devolver dos veces (SPEC-011)
- [ ] Si la devolución falla, el estado pasa a `ERROR` con mensaje descriptivo (SPEC-011)

**Dependencias previas:** T-08, T-12
**Estimación:** 3h

---

### T-15 — Gestión de inventario (SPEC-012)

**Specs:** SPEC-012

**Descripción:** Implementar el panel de administración de productos, accesible solo para el rol ADMIN.

**Entregables:**
- Puerto `domain/ports/IInventarioPort.ts`
- Hook `useInventory()` con operaciones CRUD
- Adaptador `InventarioAdapter.ts` que llama a los endpoints de productos admin
- Mock `inventario.mock.ts`
- Componente `InventoryPanel` con tabla de productos y botones de acción
- Componente `ProductFormModal` para crear/editar productos
- Guard en el store: transición a `INVENTARIO` solo si `sesion.rol === 'ADMIN'`

**Criterios de aceptación:**
- [ ] Solo usuarios con rol `ADMIN` pueden acceder al estado `INVENTARIO` (SPEC-012)
- [ ] Un cajero que intente acceder recibe error `ACCESO_DENEGADO` (SPEC-012)
- [ ] Crear un producto con nombre duplicado muestra error `PRODUCTO_DUPLICADO` (SPEC-012)
- [ ] El precio debe ser positivo — campo inválido bloquea el botón "Guardar" (SPEC-012)
- [ ] Desactivar un producto lo oculta de los resultados de búsqueda del cajero (SPEC-012)

**Dependencias previas:** T-13
**Estimación:** 4h

---

### T-16 — Reportes de cierre de caja (SPEC-013)

**Specs:** SPEC-013

**Descripción:** Implementar el panel de reportes con selector de fechas, resumen y exportación CSV.

**Entregables:**
- Puerto `domain/ports/IReportePort.ts`
- Hook `useReports()` con métodos `generar` y `exportarCSV`
- Adaptador `ReporteAdapter.ts` que llama a `GET /api/v1/reportes/cierre`
- Mock `reporte.mock.ts`
- Componente `ReportsPanel` con `DateRangePicker`, `ReportSummary` y `ExportCSVButton`
- Guard en el store: transición a `REPORTES` solo si `sesion.rol === 'ADMIN'`

**Criterios de aceptación:**
- [ ] Solo usuarios con rol `ADMIN` pueden acceder al estado `REPORTES` (SPEC-013)
- [ ] El reporte se genera al seleccionar el rango y hacer clic en "Generar" (SPEC-013)
- [ ] Los montos se muestran formateados con prefijo `$` y separador de miles (SPEC-013)
- [ ] El botón "Exportar CSV" descarga un archivo con los datos del reporte (SPEC-013)
- [ ] Si no hay ventas en el rango, se muestra *"Sin ventas en el período seleccionado"* (SPEC-013)

**Dependencias previas:** T-13
**Estimación:** 3h

---

### T-17 — Múltiples métodos de pago (SPEC-014)

**Specs:** SPEC-014

**Descripción:** Extender `PaymentPanel` para soportar efectivo, tarjeta, transferencia y pago mixto.

**Entregables:**
- Tipo `MetodoPago` y `PagoItem` en `domain/types/POSState.ts`
- Componente `PaymentMethodSelector` con íconos por método
- Lógica de pago mixto: múltiples filas de pago con suma acumulada
- Actualización de `IVentaPort.confirmar()` para incluir `pagos: PagoItem[]`
- Actualización de `VentaAdapter.ts` para enviar los pagos al backend
- Campo de referencia opcional para tarjeta/transferencia

**Criterios de aceptación:**
- [ ] El método `EFECTIVO` mantiene el comportamiento de SPEC-005 (cambio en tiempo real) (SPEC-014)
- [ ] Para métodos no-efectivo, "Confirmar" se habilita cuando monto = total (SPEC-014)
- [ ] Para `MIXTO`, la suma de pagos debe ser ≥ total para habilitar "Confirmar" (SPEC-014)
- [ ] El cambio solo aparece cuando hay componente de efectivo (SPEC-014)
- [ ] El método de pago se incluye en la respuesta de confirmación (SPEC-014)

**Dependencias previas:** T-07, T-08
**Estimación:** 4h

---

### T-18 — Impresión de recibos (SPEC-015)

**Specs:** SPEC-015

**Descripción:** Implementar la generación e impresión del recibo de venta usando CSS de impresión.

**Entregables:**
- Puerto `domain/ports/IImpresionPort.ts`
- Hook `useReceipt(ventaId)` que invoca `IImpresionPort.imprimir()`
- Adaptador `ImpresionAdapter.ts` que usa `window.print()` con estilos `@media print`
- Componente `ReceiptButton` visible en `VENTA_COMPLETA`
- Estilos CSS de impresión para formato de ticket 80mm
- Plantilla del recibo con todos los campos de SPEC-015

**Criterios de aceptación:**
- [ ] El recibo incluye: nombre del negocio, fecha/hora, cajero, ID de venta, ítems, subtotal, IVA, total, método de pago y cambio (SPEC-015)
- [ ] El botón "Imprimir recibo" está disponible en el estado `VENTA_COMPLETA` (SPEC-015)
- [ ] El recibo usa `@media print` para ocultar el resto de la UI al imprimir (SPEC-015)
- [ ] Si el método de pago no es efectivo, la línea de cambio no aparece (SPEC-015)
- [ ] El recibo es legible en papel de 80mm (SPEC-015)

**Dependencias previas:** T-08, T-17
**Estimación:** 2h

---

## 5. Orden de ejecución recomendado

```
T-01 ──► T-02 ──► T-13 (Auth) ──► T-03 ──► T-04 ──► T-05
  │        │                                           │
  │        └──► T-10b                                  │
  │                                                    ▼
  └──► T-10a ──► T-10c          T-06 ──► T-07 ──► T-17 (Métodos pago)
                                                    │
                                               T-08 ──► T-14 (Devolución)
                                                    │
                                               T-18 (Recibo)
                                                    │
                                T-09 ──► T-11 ◄─────┘
                                T-12 (Historial)
                                T-15 (Inventario) ◄── T-13
                                T-16 (Reportes)   ◄── T-13
```

---

## 6. Matriz de trazabilidad completa

| Spec | Criterios totales | Tarea(s) | Tests |
|---|---|---|---|
| SPEC-001 | 4 | T-03 | T-11 / SearchBar.test |
| SPEC-002 | 5 | T-04 | T-11 / Cart.test |
| SPEC-003 | 4 | T-05 | T-11 / Cart.test |
| SPEC-004 | 3 | T-06 | T-10a, T-10c, T-11 / OrderSummary.test |
| SPEC-005 | 3 | T-07 | T-10a, T-10c, T-11 / PaymentPanel.test |
| SPEC-006 | 3 | T-08 | T-11 / PaymentPanel.test |
| SPEC-007 | 3 | T-09 | T-11 / ErrorBanner.test |
| SPEC-008 | 4 | T-12 | T-11 / SalesHistory.test |
| SPEC-009 | 6 | T-13 | T-11 / LoginForm.test |
| SPEC-010 | 4 | T-13 | T-11 / LoginForm.test |
| SPEC-011 | 6 | T-14 | T-11 / RefundPanel.test |
| SPEC-012 | 5 | T-15 | T-11 / InventoryPanel.test |
| SPEC-013 | 5 | T-16 | T-11 / ReportsPanel.test |
| SPEC-014 | 5 | T-17 | T-11 / PaymentPanel.test |
| SPEC-015 | 5 | T-18 | T-11 / ReceiptButton.test |
| Transiciones store | 4 | T-02 | T-10b / usePOSStore.test |
| **Total** | **69** | **18 tareas** | **12 archivos de test** |

> Una spec se considera **implementada y verificada** cuando todos sus criterios de aceptación tienen al menos un test que los confirma.
