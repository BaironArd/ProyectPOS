# Diseño del Sistema — Frontend POS
**Versión:** 1.3
**Tecnología:** React 18 + TypeScript 5
**Arquitectura:** Hexagonal (Ports & Adapters)

## 1. Arquitectura en capas

```
CAPA UI          → Componentes React (SearchBar, Cart, PaymentPanel, etc.)
CAPA APPLICATION → usePOSStore (Zustand) + hooks (useSearch, useCart, usePayment, ...)
CAPA DOMINIO     → types/, ports/, calculadora.ts
CAPA INFRA       → adapters/ (producción) + mocks/ (tests)
```

## 2. Máquina de estados (EstadoUI)

Transiciones válidas:
- LOGIN → IDLE (login exitoso)
- IDLE → BUSCANDO → RESULTADOS → CARRITO_ACTIVO
- CARRITO_ACTIVO → CALCULANDO_PAGO → PROCESANDO → VENTA_COMPLETA → IDLE
- CARRITO_ACTIVO → RESULTADOS (carrito vacío)
- IDLE/RESULTADOS → HISTORIAL → estado previo
- VENTA_COMPLETA → DEVOLUCION → IDLE
- IDLE → INVENTARIO → IDLE (solo ADMIN)
- IDLE → REPORTES → IDLE (solo ADMIN)
- cualquier estado autenticado → ERROR → IDLE
- IDLE → LOGIN (logout)

## 3. Modelo de estado centralizado (POSState)

```typescript
export type EstadoUI = 'LOGIN'|'IDLE'|'BUSCANDO'|'RESULTADOS'|'CARRITO_ACTIVO'
  |'CALCULANDO_PAGO'|'PROCESANDO'|'VENTA_COMPLETA'|'HISTORIAL'
  |'DEVOLUCION'|'INVENTARIO'|'REPORTES'|'ERROR';

export type Rol = 'CAJERO' | 'ADMIN';
export type MetodoPago = 'EFECTIVO'|'TARJETA_DEBITO'|'TARJETA_CREDITO'|'TRANSFERENCIA'|'MIXTO';

export interface PagoItem { metodo: Exclude<MetodoPago,'MIXTO'>; monto: number; referencia?: string; }
export interface ItemCarrito { productoId: number; nombre: string; cantidad: number; precioUnitario: number; subtotal: number; }
export interface Resumen { subtotal: number; iva: number; total: number; }
export interface ErrorUI { codigo: string; mensaje: string; }
export interface Sesion { usuario: string; rol: Rol; token: string; }
export interface Producto { id: number; nombre: string; precio: number; stock: number; activo?: boolean; }
export interface ResumenVentaHistorial { ventaId: string; fechaHora: string; total: number; cantidadItems: number; }

export interface POSState {
  estado: EstadoUI;
  sesion: Sesion | null;
  query: string;
  productos: Producto[];
  carrito: ItemCarrito[];
  resumen: Resumen;
  metodoPago: MetodoPago | null;
  pagos: PagoItem[];
  montoPagado: number;
  cambio: number;
  historial: ResumenVentaHistorial[];
  estadoPrevio: EstadoUI | null;
  error: ErrorUI | null;
  ventaIdActual: string | null;
}
```

## 4. Calculadora (dominio puro)

```typescript
export const IVA_RATE = 0.19;
export function calcularResumen(carrito: ItemCarrito[]): Resumen
export function calcularCambio(montoPagado: number, total: number): number
export function calcularSubtotal(precio: number, cantidad: number): number
```

## 5. Puertos de dominio

| Puerto | Métodos |
|---|---|
| IProductoPort | buscar(query) |
| IVentaPort | confirmar(carrito, total, pagos) |
| IVentaHistorialPort | listar() |
| IAuthPort | login(usuario, contrasena), logout(token) |
| IDevolucionPort | procesar(ventaId) |
| IInventarioPort | listar(), crear(), actualizar(), toggleActivo() |
| IReportePort | generarCierre(desde, hasta), exportarCSV(reporte) |
| IImpresionPort | imprimir(ventaId) |

## 6. Árbol de componentes

```
POSApp
├── [LOGIN]     LoginForm
└── [autenticado]
    ├── ErrorBanner
    ├── Header (CartBadge, HistorialButton, UserBadge, LogoutButton)
    ├── [ADMIN] NavAdmin (InventarioButton, ReportesButton)
    ├── [INVENTARIO]  InventoryPanel > ProductTable, ProductFormModal
    ├── [REPORTES]    ReportsPanel > DateRangePicker, ReportSummary, ExportCSVButton
    ├── [HISTORIAL]   SalesHistory > SalesHistoryRow[], BackButton
    ├── [DEVOLUCION]  RefundPanel > RefundSummary, ConfirmRefundButton
    ├── [VENTA_COMPLETA] SuccessMessage, ReceiptButton, RefundButton
    └── [flujo venta]
        ├── SearchBar > LoadingSpinner
        ├── ProductList > ProductCard[]
        ├── Cart > CartRow[]
        ├── OrderSummary
        └── PaymentPanel > PaymentMethodSelector, MontoInput, CambioDisplay, ConfirmButton
```

## 7. Estructura de directorios

```
src/
├── domain/
│   ├── types/POSState.ts
│   ├── ports/ (8 interfaces)
│   └── calculadora.ts
├── application/
│   ├── store/usePOSStore.ts
│   └── hooks/ (useSearch, useCart, usePayment, useAuth, useHistory, useRefund, useInventory, useReports, useReceipt)
├── infrastructure/
│   ├── adapters/ (8 adaptadores)
│   └── mocks/ (7 mocks)
└── ui/
    ├── components/ (13 componentes)
    └── POSApp.tsx
```

## 8. Decisiones clave

- **Zustand** para estado global reactivo
- **JWT en memoria** (nunca localStorage) — seguridad XSS
- **Adaptadores intercambiables** — mocks en tests, producción en runtime
- **Calculadora pura** — candidata a Property-Based Testing con fast-check
- **estadoPrevio** en store — permite restaurar estado al salir de HISTORIAL
