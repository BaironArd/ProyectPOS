# Diseño del Sistema — Frontend POS
**Versión:** 1.3  
**Referencia:** especificaciones.md v1.3  
**Tecnología:** React 18 + TypeScript 5  
**Arquitectura:** Hexagonal adaptada a Frontend (Ports & Adapters)

---

## 1. Principio de diseño

El diseño implementa **exactamente** el comportamiento definido en las especificaciones. Cada decisión estructural se justifica por una spec, no por preferencia técnica.

> Regla: si un elemento de diseño no puede trazarse a una spec, se elimina.

---

## 2. Arquitectura: Frontend Hexagonal

La arquitectura separa el dominio UI de la infraestructura de datos, permitiendo que las specs sean verificables en aislamiento.

```
┌─────────────────────────────────────────────────────────────┐
│                        CAPA UI                               │
│   SearchBar  ProductList  Cart  OrderSummary  PaymentPanel  │
│   ErrorBanner  SalesHistory  LoginForm  RefundPanel         │
│   InventoryPanel  ReportsPanel  ReceiptButton               │
└────────────────────────┬────────────────────────────────────┘
                         │ eventos / props
┌────────────────────────▼────────────────────────────────────┐
│                   CAPA APPLICATION                           │
│         usePOSStore (estado centralizado Zustand)           │
│         useSearch  useCart  usePayment  useAuth  (hooks)    │
│         useHistory  useRefund  useInventory  useReports     │
└────────────────────────┬────────────────────────────────────┘
                         │ llamadas a puerto
┌────────────────────────▼────────────────────────────────────┐
│                   CAPA DOMINIO                               │
│   types/POSState.ts   types/Producto.ts   types/Carrito.ts  │
│   types/Sesion.ts  types/Devolucion.ts  types/Reporte.ts   │
│   calculadora.ts (IVA, cambio, subtotales)                  │
│   ports/IProductoPort.ts  ports/IVentaPort.ts  ← PUERTOS   │
│   ports/IAuthPort.ts  ports/IInventarioPort.ts              │
│   ports/IDevolucionPort.ts  ports/IReportePort.ts           │
│   ports/IImpresionPort.ts  ports/IVentaHistorialPort.ts     │
└────────────────────────┬────────────────────────────────────┘
                         │ implementa puertos del dominio
┌────────────────────────▼────────────────────────────────────┐
│                   CAPA INFRAESTRUCTURA                       │
│   ProductoAdapter (implementa IProductoPort: fetch / mock)  │
│   VentaAdapter    (implementa IVentaPort: confirmar / mock) │
│   AuthAdapter     (implementa IAuthPort: JWT / mock)        │
│   InventarioAdapter (implementa IInventarioPort)            │
│   DevolucionAdapter (implementa IDevolucionPort)            │
│   ReporteAdapter    (implementa IReportePort)               │
│   ImpresionAdapter  (implementa IImpresionPort: window.print)│
└─────────────────────────────────────────────────────────────┘
```

> **Principio de inversión de dependencias:** los puertos (`IProductoPort`, `IVentaPort`) son definidos por el dominio. Los adaptadores de infraestructura los implementan. Los componentes y hooks dependen de las interfaces, nunca de las implementaciones concretas.

Los adaptadores son **intercambiables**: en tests se usa el mock; en producción se apunta a la API real.

---

## 3. Diagrama de estados (máquina de estados finita)

Implementado con `XState` o equivalente reducerístico. Directamente derivado de SPEC-001 a SPEC-015.

```
              ┌──────────┐
              │  LOGIN   │◄─────────────────────────────────┐
              └────┬─────┘  (sin sesión / cierre sesión)    │
                   │ login exitoso                           │
                       ┌──────────┐                         │
              ┌───────►│   IDLE   │◄──────────────────┐     │
              │        └────┬─────┘                   │     │
              │             │ escribir ≥2 caracteres   │     │
              │        ┌────▼──────┐                  │     │
              │        │ BUSCANDO  │                  │ VENTA_COMPLETA
              │        └────┬──────┘                  │ + 3s / "Nueva venta"
              │             │ datos listos             │     │
              │        ┌────▼──────────┐               │     │
              │        │  RESULTADOS   │◄──────────┐   │     │
              │        └────┬──────────┘           │   │     │
              │             │ clic "Agregar"        │   │     │
              │        ┌────▼──────────────┐        │   │     │
              │        │  CARRITO_ACTIVO   │        │   │     │
              │        └────┬──────────────┘        │   │     │
              │             │ "Proceder al pago"    │   │     │
              │             │ carrito vacío ─────────┘   │     │
              │        ┌────▼────────────────┐          │     │
              │        │  CALCULANDO_PAGO    │          │     │
              │        └────┬────────────────┘          │     │
              │             │ "Confirmar venta"         │     │
              │        ┌────▼──────────┐                │     │
              │        │  PROCESANDO   │                │     │
              │        └────┬──────────┘                │     │
              │             │ éxito                     │     │
              │        ┌────▼────────────┐              │     │
              │        │ VENTA_COMPLETA  ├──────────────┘     │
              │        └─────────────────┘                    │
              │                                               │
              │  IDLE / RESULTADOS → HISTORIAL → estado anterior
              │  VENTA_COMPLETA → DEVOLUCION → IDLE
              │  IDLE → INVENTARIO → IDLE  (solo ADMIN)
              │  IDLE → REPORTES → IDLE    (solo ADMIN)
              │  IDLE → LOGIN  (cierre de sesión) ────────────┘
              │
              │  cualquier estado → ERROR
              │  ┌──────────┐
              └──┤  ERROR   │
                 └──────────┘
```

> **Nota SPEC-001:** la transición `IDLE → BUSCANDO` solo se activa cuando el query tiene **≥2 caracteres**. Con menos de 2 caracteres no se emite ningún evento de búsqueda.

> **Nota SPEC-003:** la transición `CARRITO_ACTIVO → RESULTADOS` ocurre automáticamente cuando el carrito queda vacío al reducir la cantidad de un ítem a 0.

> **Nota SPEC-008:** la transición `IDLE/RESULTADOS → HISTORIAL` es reversible. Al volver, el estado regresa exactamente al estado previo (incluyendo el carrito si estaba activo).

---

## 4. Diagrama de secuencia — Flujo principal

Desde SPEC-001 hasta SPEC-006 en orden.

```
Cajero        SearchBar      AppState       ProductAdapter    ProductList
  │               │              │                │               │
  │ escribe "X"   │              │                │               │
  ├──────────────►│              │                │               │
  │               │ setQuery(X)  │                │               │
  │               ├─────────────►│                │               │
  │               │              │ buscarProductos(X)             │
  │               │              ├───────────────►│               │
  │               │              │                │ productos[]   │
  │               │              │◄───────────────┤               │
  │               │              │ estado=RESULTADOS              │
  │               │              ├────────────────────────────────►
  │               │              │                │  render lista  │
  │               │              │                │               │

Cajero        ProductList    AppState          Cart          OrderSummary
  │               │              │               │                │
  │ clic Agregar  │              │               │                │
  ├──────────────►│              │               │                │
  │               │ agregarItem()│               │                │
  │               ├─────────────►│               │                │
  │               │              │ carrito++     │                │
  │               │              ├──────────────►│                │
  │               │              │               │ render tabla   │
  │               │              ├───────────────────────────────►│
  │               │              │               │  render totales│
```

---

## 5. Modelo de estado centralizado

Tipo principal del store (TypeScript):

```typescript
// domain/types/POSState.ts

export type EstadoUI =
  | 'LOGIN'
  | 'IDLE'
  | 'BUSCANDO'
  | 'RESULTADOS'
  | 'CARRITO_ACTIVO'
  | 'CALCULANDO_PAGO'
  | 'PROCESANDO'
  | 'VENTA_COMPLETA'
  | 'HISTORIAL'
  | 'DEVOLUCION'
  | 'INVENTARIO'
  | 'REPORTES'
  | 'ERROR';

export type Rol = 'CAJERO' | 'ADMIN';

export type MetodoPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' | 'MIXTO';

export interface PagoItem {
  metodo: Exclude<MetodoPago, 'MIXTO'>;
  monto: number;
  referencia?: string;  // para tarjeta/transferencia
}

export interface ItemCarrito {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;            // precioUnitario × cantidad
}

export interface Resumen {
  subtotal: number;            // Σ subtotales
  iva: number;                 // subtotal × 0.19, redondeado al peso
  total: number;               // subtotal + iva
}

export interface ErrorUI {
  codigo: string;
  mensaje: string;
}

export interface POSState {
  estado: EstadoUI;
  sesion: Sesion | null;           // SPEC-009, SPEC-010
  query: string;
  productos: Producto[];
  carrito: ItemCarrito[];
  resumen: Resumen;
  metodoPago: MetodoPago | null;   // SPEC-014
  pagos: PagoItem[];               // SPEC-014
  montoPagado: number;
  cambio: number;
  historial: ResumenVentaHistorial[];
  estadoPrevio: EstadoUI | null;
  error: ErrorUI | null;
}
```

```typescript
// domain/types/Producto.ts

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
}
```

```typescript
// domain/types/Historial.ts

export interface ResumenVentaHistorial {
  ventaId: string;
  fechaHora: string;   // ISO 8601
  total: number;
  cantidadItems: number;
}
```

```typescript
// domain/types/Sesion.ts

export interface Sesion {
  usuario: string;
  rol: Rol;
  token: string;       // JWT — almacenado en memoria, nunca en localStorage
}
```

```typescript
// domain/types/Devolucion.ts

export interface Devolucion {
  ventaId: string;
  montoDevuelto: number;
  estado: 'DEVUELTA' | 'PENDIENTE';
}
```

```typescript
// domain/types/Reporte.ts

export interface ReporteCierre {
  fechaDesde: string;
  fechaHasta: string;
  totalVentas: number;
  totalDevueltas: number;
  montoTotal: number;
  montoDevuelto: number;
  montoNeto: number;
  ventasPorCajero: VentasPorCajero[];
}

export interface VentasPorCajero {
  usuario: string;
  ventas: number;
  monto: number;
}
```

---

## 6. Modelo de dominio: Calculadora

Lógica pura sin efectos secundarios. Directamente trazable a SPEC-004 y SPEC-005.

```typescript
// domain/calculadora.ts

export const IVA_RATE = 0.19;

export function calcularResumen(carrito: ItemCarrito[]): Resumen {
  const subtotal = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  const iva = Math.round(subtotal * IVA_RATE);
  const total = subtotal + iva;
  return { subtotal, iva, total };
}

export function calcularCambio(montoPagado: number, total: number): number {
  return montoPagado - total;
}

export function calcularSubtotal(precio: number, cantidad: number): number {
  return precio * cantidad;
}
```

> Estas funciones son **testeables en aislamiento** sin renderizar componentes.

---

## 7. Contratos de puertos (definidos en el dominio)

Los puertos son interfaces que pertenecen al **dominio**. Los adaptadores de infraestructura los implementan. Esto garantiza la inversión de dependencias: el dominio no conoce la infraestructura.

```typescript
// domain/ports/IProductoPort.ts

export interface IProductoPort {
  buscar(query: string): Promise<Producto[]>;
}
```

```typescript
// domain/ports/IVentaPort.ts

export interface IVentaPort {
  confirmar(carrito: ItemCarrito[], total: number): Promise<{ ok: boolean }>;
}
```

```typescript
// domain/ports/IVentaHistorialPort.ts

export interface IVentaHistorialPort {
  listar(): Promise<ResumenVentaHistorial[]>;
}
```

```typescript
// domain/ports/IAuthPort.ts  — SPEC-009, SPEC-010

export interface IAuthPort {
  login(usuario: string, contrasena: string): Promise<Sesion>;
  logout(token: string): Promise<void>;
}
```

```typescript
// domain/ports/IDevolucionPort.ts  — SPEC-011

export interface IDevolucionPort {
  procesar(ventaId: string): Promise<Devolucion>;
}
```

```typescript
// domain/ports/IInventarioPort.ts  — SPEC-012

export interface IInventarioPort {
  listar(): Promise<Producto[]>;
  crear(producto: NuevoProducto): Promise<Producto>;
  actualizar(id: number, cambios: Partial<Producto>): Promise<Producto>;
  toggleActivo(id: number): Promise<Producto>;
}
```

```typescript
// domain/ports/IReportePort.ts  — SPEC-013

export interface IReportePort {
  generarCierre(fechaDesde: string, fechaHasta: string): Promise<ReporteCierre>;
  exportarCSV(reporte: ReporteCierre): Promise<Blob>;
}
```

```typescript
// domain/ports/IImpresionPort.ts  — SPEC-015

export interface IImpresionPort {
  imprimir(ventaId: string): Promise<void>;
}
```

Los hooks y el store dependen de estas interfaces. Los adaptadores concretos se inyectan en tiempo de ejecución (o en tests con mocks).

---

## 8. Árbol de componentes

```
<POSApp>                          ← raíz, provee el store
  │
  ├── [si estado=LOGIN]
  │     └── <LoginForm>           ← SPEC-009 (usuario, contraseña, botón ingresar)
  │
  └── [si sesión activa]
        ├── <ErrorBanner>               ← SPEC-007 (visible si estado=ERROR)
        ├── <Header>                    ← título, badge, historial, usuario, cerrar sesión
        │     ├── <CartBadge>
        │     ├── <HistorialButton>     ← SPEC-008
        │     ├── <UserBadge>           ← muestra usuario y rol activo
        │     └── <LogoutButton>        ← SPEC-010
        │
        ├── [si rol=ADMIN]
        │     ├── <NavAdmin>            ← botones Inventario y Reportes
        │     │     ├── <InventarioButton>  ← SPEC-012
        │     │     └── <ReportesButton>    ← SPEC-013
        │
        ├── [si estado=INVENTARIO]
        │     └── <InventoryPanel>      ← SPEC-012
        │           ├── <ProductTable>[]
        │           └── <ProductFormModal>
        │
        ├── [si estado=REPORTES]
        │     └── <ReportsPanel>        ← SPEC-013
        │           ├── <DateRangePicker>
        │           ├── <ReportSummary>
        │           └── <ExportCSVButton>
        │
        ├── [si estado=HISTORIAL]
        │     └── <SalesHistory>        ← SPEC-008
        │           ├── <SalesHistoryRow>[]
        │           └── <BackButton>
        │
        ├── [si estado=DEVOLUCION]
        │     └── <RefundPanel>         ← SPEC-011
        │           ├── <RefundSummary>
        │           └── <ConfirmRefundButton>
        │
        ├── [si estado=VENTA_COMPLETA]
        │     ├── <SuccessMessage>
        │     ├── <ReceiptButton>       ← SPEC-015
        │     └── <RefundButton>        ← SPEC-011 (inicia devolución)
        │
        └── [flujo principal de venta]
              ├── <SearchBar>           ← SPEC-001
              │     └── <LoadingSpinner>
              ├── <ProductList>         ← SPEC-001, SPEC-002
              │     └── <ProductCard>[]
              ├── <Cart>                ← SPEC-002, SPEC-003
              │     └── <CartRow>[]
              ├── <OrderSummary>        ← SPEC-004 (solo lectura)
              └── <PaymentPanel>        ← SPEC-005, SPEC-006, SPEC-014
                    ├── <PaymentMethodSelector>  ← SPEC-014
                    ├── <MontoInput>
                    ├── <CambioDisplay>
                    └── <ConfirmButton>
```

---

## 9. Estructura de directorios

```
src/
├── domain/
│   ├── types/
│   │   ├── POSState.ts
│   │   ├── Producto.ts
│   │   ├── Carrito.ts
│   │   ├── Sesion.ts             ← SPEC-009, SPEC-010
│   │   ├── Devolucion.ts         ← SPEC-011
│   │   ├── Historial.ts          ← SPEC-008
│   │   └── Reporte.ts            ← SPEC-013
│   ├── ports/
│   │   ├── IProductoPort.ts
│   │   ├── IVentaPort.ts
│   │   ├── IVentaHistorialPort.ts
│   │   ├── IAuthPort.ts          ← SPEC-009, SPEC-010
│   │   ├── IDevolucionPort.ts    ← SPEC-011
│   │   ├── IInventarioPort.ts    ← SPEC-012
│   │   ├── IReportePort.ts       ← SPEC-013
│   │   └── IImpresionPort.ts     ← SPEC-015
│   └── calculadora.ts
│
├── application/
│   ├── store/
│   │   └── usePOSStore.ts
│   └── hooks/
│       ├── useSearch.ts
│       ├── useCart.ts
│       ├── usePayment.ts         ← extendido con SPEC-014 (métodos de pago)
│       ├── useHistory.ts
│       ├── useAuth.ts            ← SPEC-009, SPEC-010
│       ├── useRefund.ts          ← SPEC-011
│       ├── useInventory.ts       ← SPEC-012
│       ├── useReports.ts         ← SPEC-013
│       └── useReceipt.ts         ← SPEC-015
│
├── infrastructure/
│   ├── adapters/
│   │   ├── ProductoAdapter.ts
│   │   ├── VentaAdapter.ts
│   │   ├── VentaHistorialAdapter.ts
│   │   ├── AuthAdapter.ts        ← implementa IAuthPort
│   │   ├── DevolucionAdapter.ts  ← implementa IDevolucionPort
│   │   ├── InventarioAdapter.ts  ← implementa IInventarioPort
│   │   ├── ReporteAdapter.ts     ← implementa IReportePort
│   │   └── ImpresionAdapter.ts   ← implementa IImpresionPort (window.print)
│   └── mocks/
│       ├── productos.mock.ts
│       ├── venta.mock.ts
│       ├── historial.mock.ts
│       ├── auth.mock.ts
│       ├── devolucion.mock.ts
│       ├── inventario.mock.ts
│       └── reporte.mock.ts
│
├── ui/
│   ├── components/
│   │   ├── LoginForm/             ← SPEC-009
│   │   ├── SearchBar/
│   │   ├── ProductList/
│   │   ├── Cart/
│   │   ├── OrderSummary/
│   │   ├── PaymentPanel/          ← extendido con PaymentMethodSelector (SPEC-014)
│   │   ├── SalesHistory/
│   │   ├── RefundPanel/           ← SPEC-011
│   │   ├── InventoryPanel/        ← SPEC-012
│   │   ├── ReportsPanel/          ← SPEC-013
│   │   ├── ReceiptButton/         ← SPEC-015
│   │   └── ErrorBanner/
│   └── POSApp.tsx
│
└── main.tsx
```

---

## 10. Decisiones de diseño justificadas

| Decisión | Justificación en specs |
|---|---|
| Estado centralizado (Zustand) | SPEC-004 requiere actualización reactiva de totales desde múltiples componentes |
| Máquina de estados explícita | Cada spec define transiciones precisas; sin máquina de estados se rompen fácilmente |
| Calculadora como función pura | SPEC-004, SPEC-005 tienen fórmulas deterministas — candidatas a Property-Based Testing |
| Puertos en `domain/ports/` | Inversión de dependencias: el dominio define los contratos, la infraestructura los implementa |
| Adaptadores intercambiables | Todos los puertos tienen mocks para tests sin backend |
| `ConfirmButton` desactivable | SPEC-005 exige que `montoPagado < total` bloquee la confirmación |
| Transición `CARRITO_ACTIVO → RESULTADOS` | SPEC-003 define que carrito vacío regresa al estado de resultados |
| `estadoPrevio` en el store | SPEC-008 exige restaurar el estado anterior al salir de HISTORIAL |
| `IVentaHistorialPort` separado de `IVentaPort` | ISP: el hook `useHistory` no debe depender de métodos de confirmación |
| Token JWT en memoria (no localStorage) | SPEC-009: localStorage es vulnerable a XSS; memoria es más segura para tokens |
| Estado `LOGIN` como estado inicial sin sesión | SPEC-009: toda la app requiere autenticación previa |
| `IAuthPort` en dominio | DIP: el dominio define el contrato de autenticación; el adaptador implementa JWT |
| `MetodoPago` como tipo union | SPEC-014: los métodos de pago son un conjunto cerrado y verificable en tiempo de compilación |
| `PagoItem[]` en el store | SPEC-014: el pago mixto requiere múltiples entradas con método y monto individual |
| `IImpresionPort` con `window.print()` | SPEC-015: la impresión es una operación de infraestructura — el dominio no conoce el navegador |
| Roles `CAJERO` / `ADMIN` en `Sesion` | SPEC-012, SPEC-013: el acceso a inventario y reportes depende del rol activo |
