# Implementation Tasks — Frontend POS

## Tasks

- [ ] 1. Scaffolding and base domain
  - [ ] 1.1 Initialize React + TypeScript project with Vite in `PROYECTPOS/frontend/pos-frontend/`
  - [ ] 1.2 Install dependencies: zustand, vitest, @testing-library/react, fast-check, eslint, prettier
  - [ ] 1.3 Create domain types: POSState.ts, Producto.ts, Sesion.ts, Devolucion.ts, Historial.ts, Reporte.ts
  - [ ] 1.4 Create domain ports: IProductoPort, IVentaPort, IVentaHistorialPort, IAuthPort, IDevolucionPort, IInventarioPort, IReportePort, IImpresionPort
  - [ ] 1.5 Create calculadora.ts with calcularResumen, calcularCambio, calcularSubtotal
  - [ ] 1.6 Configure TypeScript paths (@domain, @application, @infrastructure, @ui)

- [ ] 2. Centralized state store
  - [ ] 2.1 Implement usePOSStore with Zustand with complete initial state
  - [ ] 2.2 Implement actions: setQuery, setProductos, setEstado, agregarAlCarrito, modificarCantidad, eliminarDelCarrito
  - [ ] 2.3 Implement actions: setMontoPagado, setMetodoPago, agregarPago, confirmarVenta, resetVenta
  - [ ] 2.4 Implement actions: setError, clearError, login, logout, verHistorial, volverDeHistorial
  - [ ] 2.5 Implement state transition validation (reject invalid transitions)
  - [ ] 2.6 Implement automatic transition CARRITO_ACTIVO → RESULTADOS when cart becomes empty

- [ ] 3. Infrastructure mocks
  - [ ] 3.1 Create productos.mock.ts with test data
  - [ ] 3.2 Create venta.mock.ts
  - [ ] 3.3 Create historial.mock.ts
  - [ ] 3.4 Create auth.mock.ts with cajero01/CAJERO and admin01/ADMIN
  - [ ] 3.5 Create devolucion.mock.ts
  - [ ] 3.6 Create inventario.mock.ts
  - [ ] 3.7 Create reporte.mock.ts

- [ ] 4. Authentication and session (SPEC-009, SPEC-010)
  - [ ] 4.1 Implement LoginForm with username/password fields and "Log in" button
  - [ ] 4.2 Implement useAuth hook that invokes IAuthPort
  - [ ] 4.3 Implement AuthAdapter (POST /api/v1/auth/login and logout)
  - [ ] 4.4 Implement session guard: redirect to LOGIN if no active session
  - [ ] 4.5 Implement HTTP interceptor with Authorization: Bearer token header
  - [ ] 4.6 Implement LogoutButton and complete state reset on logout

- [ ] 5. Product search (SPEC-001)
  - [ ] 5.1 Implement SearchBar with controlled text field and debounce
  - [ ] 5.2 Implement useSearch hook that invokes IProductoPort.buscar
  - [ ] 5.3 Implement ProductoAdapter (GET /api/v1/productos?q=)
  - [ ] 5.4 Implement LoadingSpinner visible while state === BUSCANDO
  - [ ] 5.5 Show message "No results for X" when list is empty

- [ ] 6. Shopping cart (SPEC-002, SPEC-003)
  - [ ] 6.1 Implement ProductList and ProductCard with Add button
  - [ ] 6.2 Implement Cart with item table (CartRow)
  - [ ] 6.3 Implement CartBadge in Header with unique item counter
  - [ ] 6.4 Implement +/- controls and numeric input in CartRow
  - [ ] 6.5 Implement automatic removal when quantity is reduced to 0

- [ ] 7. Purchase summary with VAT (SPEC-004)
  - [ ] 7.1 Implement read-only OrderSummary connected to the store
  - [ ] 7.2 Show Subtotal, VAT (19%) and Total with format $X.XXX
  - [ ] 7.3 Verify real-time recalculation when cart is modified

- [ ] 8. Payment panel and payment methods (SPEC-005, SPEC-014)
  - [ ] 8.1 Implement PaymentPanel with MontoInput field (positive numbers only)
  - [ ] 8.2 Implement CambioDisplay with red/green indicator
  - [ ] 8.3 Implement PaymentMethodSelector with options EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO, TRANSFERENCIA, MIXTO
  - [ ] 8.4 Implement mixed payment logic with multiple PagoItem rows
  - [ ] 8.5 Disable Confirm button when montoPagado < total

- [ ] 9. Sale confirmation (SPEC-006)
  - [ ] 9.1 Implement confirmarVenta action that invokes IVentaPort.confirmar
  - [ ] 9.2 Implement VentaAdapter (POST /api/v1/ventas)
  - [ ] 9.3 Show spinner while state === PROCESANDO
  - [ ] 9.4 Show success message "Sale completed! Change: $X.XXX"
  - [ ] 9.5 Implement automatic reset to IDLE after 3 seconds or click on "New sale"

- [ ] 10. Global error handling (SPEC-007)
  - [ ] 10.1 Implement ErrorBanner visible when state === ERROR
  - [ ] 10.2 Implement differentiated messages by error.codigo
  - [ ] 10.3 Implement Retry button and manual close button

- [ ] 11. Sales history (SPEC-008)
  - [ ] 11.1 Implement SalesHistory with sales table and Back button
  - [ ] 11.2 Implement useHistory hook that invokes IVentaHistorialPort.listar
  - [ ] 11.3 Implement VentaHistorialAdapter (GET /api/v1/ventas)
  - [ ] 11.4 Save and restore estadoPrevio when entering/leaving HISTORIAL

- [ ] 12. Returns (SPEC-011)
  - [ ] 12.1 Implement RefundPanel with summary and Confirm/Cancel buttons
  - [ ] 12.2 Implement useRefund hook that invokes IDevolucionPort.procesar
  - [ ] 12.3 Implement DevolucionAdapter (POST /api/v1/ventas/{id}/devolucion)
  - [ ] 12.4 Show "Return sale" button in VENTA_COMPLETA and in SalesHistory

- [ ] 13. Inventory management — ADMIN only (SPEC-012)
  - [ ] 13.1 Implement InventoryPanel with product table
  - [ ] 13.2 Implement ProductFormModal for creating/editing products
  - [ ] 13.3 Implement useInventory hook with CRUD operations
  - [ ] 13.4 Implement InventarioAdapter
  - [ ] 13.5 Implement ADMIN guard: reject access with ACCESO_DENEGADO error if role is CAJERO

- [ ] 14. End-of-day reports — ADMIN only (SPEC-013)
  - [ ] 14.1 Implement ReportsPanel with DateRangePicker, ReportSummary and ExportCSVButton
  - [ ] 14.2 Implement useReports hook with generate and exportarCSV methods
  - [ ] 14.3 Implement ReporteAdapter (GET /api/v1/reportes/cierre)
  - [ ] 14.4 Implement ADMIN guard for access to REPORTES

- [ ] 15. Receipt printing (SPEC-015)
  - [ ] 15.1 Implement ReceiptButton visible in VENTA_COMPLETA
  - [ ] 15.2 Implement useReceipt hook that invokes IImpresionPort.imprimir
  - [ ] 15.3 Implement ImpresionAdapter with window.print() and @media print styles
  - [ ] 15.4 Create receipt template with all fields (80mm ticket)

- [ ] 16. Root component and final assembly
  - [ ] 16.1 Implement POSApp.tsx as root that provides the store
  - [ ] 16.2 Implement Header with CartBadge, HistorialButton, UserBadge, LogoutButton
  - [ ] 16.3 Implement NavAdmin with Inventory and Reports buttons (ADMIN only)
  - [ ] 16.4 Connect all components according to design tree
  - [ ] 16.5 Verify that npm run build compiles without TypeScript errors

- [ ] 17. Calculator unit tests (SPEC-004, SPEC-005)
  - [ ] 17.1 Create calculadora.test.ts with cases for calcularResumen, calcularCambio, calcularSubtotal
  - [ ] 17.2 Create calculadora.property.test.ts with 5 properties using fast-check (≥100 cases per property)

- [ ] 18. Store unit tests
  - [ ] 18.1 Create usePOSStore.test.ts with valid and invalid transitions
  - [ ] 18.2 Cover automatic transition CARRITO_ACTIVO → RESULTADOS when cart is emptied
  - [ ] 18.3 Create store.property.test.ts with state machine properties using fast-check
