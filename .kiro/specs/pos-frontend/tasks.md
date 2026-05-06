# Tareas de Implementación — Frontend POS

## Tasks

- [ ] 1. Scaffolding y dominio base
  - [ ] 1.1 Inicializar proyecto React + TypeScript con Vite en `PROYECTPOS/frontend/pos-frontend/`
  - [ ] 1.2 Instalar dependencias: zustand, vitest, @testing-library/react, fast-check, eslint, prettier
  - [ ] 1.3 Crear tipos de dominio: POSState.ts, Producto.ts, Sesion.ts, Devolucion.ts, Historial.ts, Reporte.ts
  - [ ] 1.4 Crear puertos de dominio: IProductoPort, IVentaPort, IVentaHistorialPort, IAuthPort, IDevolucionPort, IInventarioPort, IReportePort, IImpresionPort
  - [ ] 1.5 Crear calculadora.ts con calcularResumen, calcularCambio, calcularSubtotal
  - [ ] 1.6 Configurar paths de TypeScript (@domain, @application, @infrastructure, @ui)

- [ ] 2. Store de estado centralizado
  - [ ] 2.1 Implementar usePOSStore con Zustand con estado inicial completo
  - [ ] 2.2 Implementar acciones: setQuery, setProductos, setEstado, agregarAlCarrito, modificarCantidad, eliminarDelCarrito
  - [ ] 2.3 Implementar acciones: setMontoPagado, setMetodoPago, agregarPago, confirmarVenta, resetVenta
  - [ ] 2.4 Implementar acciones: setError, clearError, login, logout, verHistorial, volverDeHistorial
  - [ ] 2.5 Implementar validación de transiciones de estado (rechazar transiciones inválidas)
  - [ ] 2.6 Implementar transición automática CARRITO_ACTIVO → RESULTADOS cuando carrito queda vacío

- [ ] 3. Mocks de infraestructura
  - [ ] 3.1 Crear productos.mock.ts con datos de prueba
  - [ ] 3.2 Crear venta.mock.ts
  - [ ] 3.3 Crear historial.mock.ts
  - [ ] 3.4 Crear auth.mock.ts con cajero01/CAJERO y admin01/ADMIN
  - [ ] 3.5 Crear devolucion.mock.ts
  - [ ] 3.6 Crear inventario.mock.ts
  - [ ] 3.7 Crear reporte.mock.ts

- [ ] 4. Autenticación y sesión (SPEC-009, SPEC-010)
  - [ ] 4.1 Implementar LoginForm con campos usuario/contraseña y botón "Ingresar"
  - [ ] 4.2 Implementar useAuth hook que invoca IAuthPort
  - [ ] 4.3 Implementar AuthAdapter (POST /api/v1/auth/login y logout)
  - [ ] 4.4 Implementar guard de sesión: redirigir a LOGIN si no hay sesión activa
  - [ ] 4.5 Implementar interceptor HTTP con header Authorization: Bearer token
  - [ ] 4.6 Implementar LogoutButton y reset completo de estado al cerrar sesión

- [ ] 5. Búsqueda de productos (SPEC-001)
  - [ ] 5.1 Implementar SearchBar con campo de texto controlado y debounce
  - [ ] 5.2 Implementar useSearch hook que invoca IProductoPort.buscar
  - [ ] 5.3 Implementar ProductoAdapter (GET /api/v1/productos?q=)
  - [ ] 5.4 Implementar LoadingSpinner visible mientras estado === BUSCANDO
  - [ ] 5.5 Mostrar mensaje "Sin resultados para X" cuando lista vacía

- [ ] 6. Carrito de compras (SPEC-002, SPEC-003)
  - [ ] 6.1 Implementar ProductList y ProductCard con botón Agregar
  - [ ] 6.2 Implementar Cart con tabla de ítems (CartRow)
  - [ ] 6.3 Implementar CartBadge en Header con contador de ítems únicos
  - [ ] 6.4 Implementar controles +/- y input numérico en CartRow
  - [ ] 6.5 Implementar eliminación automática al reducir cantidad a 0

- [ ] 7. Resumen de compra con IVA (SPEC-004)
  - [ ] 7.1 Implementar OrderSummary de solo lectura conectado al store
  - [ ] 7.2 Mostrar Subtotal, IVA (19%) y Total con formato $X.XXX
  - [ ] 7.3 Verificar recálculo en tiempo real al modificar carrito

- [ ] 8. Panel de pago y métodos de pago (SPEC-005, SPEC-014)
  - [ ] 8.1 Implementar PaymentPanel con campo MontoInput (solo números positivos)
  - [ ] 8.2 Implementar CambioDisplay con indicador rojo/verde
  - [ ] 8.3 Implementar PaymentMethodSelector con opciones EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO, TRANSFERENCIA, MIXTO
  - [ ] 8.4 Implementar lógica de pago mixto con múltiples filas PagoItem
  - [ ] 8.5 Deshabilitar botón Confirmar cuando montoPagado < total

- [ ] 9. Confirmación de venta (SPEC-006)
  - [ ] 9.1 Implementar acción confirmarVenta que invoca IVentaPort.confirmar
  - [ ] 9.2 Implementar VentaAdapter (POST /api/v1/ventas)
  - [ ] 9.3 Mostrar spinner mientras estado === PROCESANDO
  - [ ] 9.4 Mostrar mensaje éxito "¡Venta completada! Cambio: $X.XXX"
  - [ ] 9.5 Implementar reset automático a IDLE tras 3 segundos o clic en "Nueva venta"

- [ ] 10. Manejo de errores global (SPEC-007)
  - [ ] 10.1 Implementar ErrorBanner visible cuando estado === ERROR
  - [ ] 10.2 Implementar mensajes diferenciados por error.codigo
  - [ ] 10.3 Implementar botón Reintentar y botón de cierre manual

- [ ] 11. Historial de ventas (SPEC-008)
  - [ ] 11.1 Implementar SalesHistory con tabla de ventas y botón Volver
  - [ ] 11.2 Implementar useHistory hook que invoca IVentaHistorialPort.listar
  - [ ] 11.3 Implementar VentaHistorialAdapter (GET /api/v1/ventas)
  - [ ] 11.4 Guardar y restaurar estadoPrevio al entrar/salir de HISTORIAL

- [ ] 12. Devoluciones (SPEC-011)
  - [ ] 12.1 Implementar RefundPanel con resumen y botones Confirmar/Cancelar
  - [ ] 12.2 Implementar useRefund hook que invoca IDevolucionPort.procesar
  - [ ] 12.3 Implementar DevolucionAdapter (POST /api/v1/ventas/{id}/devolucion)
  - [ ] 12.4 Mostrar botón "Devolver venta" en VENTA_COMPLETA y en SalesHistory

- [ ] 13. Gestión de inventario — solo ADMIN (SPEC-012)
  - [ ] 13.1 Implementar InventoryPanel con tabla de productos
  - [ ] 13.2 Implementar ProductFormModal para crear/editar productos
  - [ ] 13.3 Implementar useInventory hook con operaciones CRUD
  - [ ] 13.4 Implementar InventarioAdapter
  - [ ] 13.5 Implementar guard ADMIN: rechazar acceso con error ACCESO_DENEGADO si rol es CAJERO

- [ ] 14. Reportes de cierre de caja — solo ADMIN (SPEC-013)
  - [ ] 14.1 Implementar ReportsPanel con DateRangePicker, ReportSummary y ExportCSVButton
  - [ ] 14.2 Implementar useReports hook con métodos generar y exportarCSV
  - [ ] 14.3 Implementar ReporteAdapter (GET /api/v1/reportes/cierre)
  - [ ] 14.4 Implementar guard ADMIN para acceso a REPORTES

- [ ] 15. Impresión de recibo (SPEC-015)
  - [ ] 15.1 Implementar ReceiptButton visible en VENTA_COMPLETA
  - [ ] 15.2 Implementar useReceipt hook que invoca IImpresionPort.imprimir
  - [ ] 15.3 Implementar ImpresionAdapter con window.print() y estilos @media print
  - [ ] 15.4 Crear plantilla de recibo con todos los campos (ticket 80mm)

- [ ] 16. Componente raíz y ensamblaje final
  - [ ] 16.1 Implementar POSApp.tsx como raíz que provee el store
  - [ ] 16.2 Implementar Header con CartBadge, HistorialButton, UserBadge, LogoutButton
  - [ ] 16.3 Implementar NavAdmin con botones Inventario y Reportes (solo ADMIN)
  - [ ] 16.4 Conectar todos los componentes según árbol de diseño
  - [ ] 16.5 Verificar que npm run build compila sin errores TypeScript

- [ ] 17. Tests unitarios de calculadora (SPEC-004, SPEC-005)
  - [ ] 17.1 Crear calculadora.test.ts con casos para calcularResumen, calcularCambio, calcularSubtotal
  - [ ] 17.2 Crear calculadora.property.test.ts con 5 propiedades usando fast-check (≥100 casos por propiedad)

- [ ] 18. Tests unitarios del store
  - [ ] 18.1 Crear usePOSStore.test.ts con transiciones válidas e inválidas
  - [ ] 18.2 Cubrir transición automática CARRITO_ACTIVO → RESULTADOS al vaciar carrito
  - [ ] 18.3 Crear store.property.test.ts con propiedades de máquina de estados usando fast-check
