# Requirements Document — Frontend POS

## Introduction

The **POS Frontend** system is a point-of-sale web application built with React 18 + TypeScript 5. It allows cashiers and administrators to manage the complete sales cycle: product search, cart building, tax calculation, payment processing (cash, card, transfer and mixed), sale confirmation, receipt printing, history lookup, returns, inventory management and end-of-day reports.

The interface operates as a **finite state machine** with 13 mutually exclusive states. The architecture follows the Hexagonal pattern (Ports & Adapters): the domain layer defines contracts (ports), the infrastructure layer implements them (adapters), and the application layer orchestrates state with Zustand.

---

## Glossary

- **System**: The POS frontend application as a whole.
- **Cashier**: Authenticated user with role `CAJERO`. Can process sales, view history and process returns.
- **Admin**: Authenticated user with role `ADMIN`. Has access to all Cashier functions plus inventory management and reports.
- **Store**: The centralized application state managed with Zustand (`usePOSStore`).
- **Calculator**: Pure domain module (`calculadora.ts`) that implements `calcularResumen`, `calcularCambio` and `calcularSubtotal`.
- **Port**: Domain interface that defines a contract for accessing data or external services (e.g. `IProductoPort`, `IVentaPort`).
- **Adapter**: Concrete implementation of a Port in the infrastructure layer.
- **Cart**: Collection of `ItemCarrito` in the Store representing the products selected for the current sale.
- **Summary**: Calculated object with `subtotal`, `iva` and `total` derived from the Cart.
- **Session**: Object containing `usuario`, `rol` and JWT `token` stored in memory.
- **UIState**: Union type representing the active state of the state machine: `LOGIN | IDLE | BUSCANDO | RESULTADOS | CARRITO_ACTIVO | CALCULANDO_PAGO | PROCESANDO | VENTA_COMPLETA | HISTORIAL | DEVOLUCION | INVENTARIO | REPORTES | ERROR`.
- **PaymentMethod**: Union type of accepted payment methods: `EFECTIVO | TARJETA_DEBITO | TARJETA_CREDITO | TRANSFERENCIA | MIXTO`.
- **IVA_RATE**: Domain constant with value `0.19` (19%).
- **SearchBar**: Product search component.
- **ProductList**: Component that renders the list of found products.
- **Cart**: Component that shows the active Cart items.
- **OrderSummary**: Read-only component that shows Subtotal, VAT and Total.
- **PaymentPanel**: Component that manages amount entry and payment method selection.
- **ErrorBanner**: Cross-cutting component that shows recoverable errors.
- **LoginForm**: Authentication component with username and password fields.
- **SalesHistory**: Component that shows the shift sales history.
- **RefundPanel**: Component that manages the return flow for a sale.
- **InventoryPanel**: Product catalog management component (Admin only).
- **ReportsPanel**: End-of-day report component (Admin only).
- **ReceiptButton**: Component that triggers sale receipt printing.

---

## Requirements

---

### Requirement 1: UI State Machine

**User Story:** As a system developer, I want the interface to operate as a finite state machine, so that transitions between screens are predictable and verifiable.

#### Acceptance Criteria

1. THE System SHALL maintain exactly one UIState active at all times.
2. WHEN the user has no active Session, THE System SHALL set the UIState to `LOGIN`.
3. WHEN login is successful, THE System SHALL transition the UIState from `LOGIN` to `IDLE`.
4. WHEN the user logs out, THE System SHALL transition the UIState to `LOGIN` and clear the Session.
5. WHEN a recoverable error occurs in any authenticated UIState, THE System SHALL transition the UIState to `ERROR` preserving the error context.
6. IF the Store receives an invalid transition action (e.g. `IDLE` → `PROCESANDO`), THEN THE Store SHALL ignore the action and keep the UIState unchanged.
7. THE System SHALL support the following valid transitions: `LOGIN→IDLE`, `IDLE→BUSCANDO`, `BUSCANDO→RESULTADOS`, `RESULTADOS→CARRITO_ACTIVO`, `CARRITO_ACTIVO→CALCULANDO_PAGO`, `CALCULANDO_PAGO→PROCESANDO`, `PROCESANDO→VENTA_COMPLETA`, `VENTA_COMPLETA→IDLE`, `CARRITO_ACTIVO→RESULTADOS`, `IDLE→HISTORIAL`, `RESULTADOS→HISTORIAL`, `HISTORIAL→IDLE`, `HISTORIAL→RESULTADOS`, `VENTA_COMPLETA→DEVOLUCION`, `DEVOLUCION→IDLE`, `IDLE→INVENTARIO`, `INVENTARIO→IDLE`, `IDLE→REPORTES`, `REPORTES→IDLE`, `any_authenticated_state→ERROR`, `ERROR→IDLE`.

---

### Requirement 2: Product Search (SPEC-001)

**User Story:** As a Cashier, I want to search for products by name or code, to quickly find the items the customer wants to buy.

#### Acceptance Criteria

1. WHEN the Cashier types fewer than 2 characters in the SearchBar, THE System SHALL keep the UIState in `IDLE` without invoking `IProductoPort.buscar`.
2. WHEN the Cashier types 2 or more characters in the SearchBar, THE System SHALL transition the UIState to `BUSCANDO` and invoke `IProductoPort.buscar` with the entered text.
3. WHILE the UIState is `BUSCANDO`, THE SearchBar SHALL show a visible loading indicator.
4. WHEN `IProductoPort.buscar` returns a non-empty product list, THE System SHALL transition the UIState to `RESULTADOS` and render the products in the ProductList.
5. WHEN `IProductoPort.buscar` returns an empty list, THE System SHALL transition the UIState to `RESULTADOS` and show the message "No results for '[query]'" in the ProductList.
6. IF `IProductoPort.buscar` fails with an error, THEN THE System SHALL transition the UIState to `ERROR` with code `LOAD_FAILED` and message "Could not load products. Please try again."
7. THE SearchBar SHALL render each product with name, formatted price and "Add" button.
8. THE System SHALL execute the search without reloading the page.

---

### Requirement 3: Add Product to Cart (SPEC-002)

**User Story:** As a Cashier, I want to add products to the cart with one click, to build the item list for the current sale.

#### Acceptance Criteria

1. WHEN the Cashier clicks "Add" on a product with `stock > 0`, THE Store SHALL add the product to the Cart with `cantidad: 1` if it does not exist, or increment `cantidad` by 1 if it already exists.
2. WHEN the Cashier adds the first item to the Cart, THE System SHALL transition the UIState from `RESULTADOS` to `CARRITO_ACTIVO`.
3. THE Cart SHALL show each CartItem with columns: Name, Unit price, Quantity, Subtotal and Remove action.
4. THE Store SHALL calculate `subtotal = precioUnitario × cantidad` for each CartItem on every Cart modification.
5. WHEN the stock of a product is `0`, THE ProductList SHALL render that product's "Add" button in disabled state.
6. THE System SHALL show a CartBadge in the header with the number of unique items in the Cart.

---

### Requirement 4: Modify and Remove Cart Items (SPEC-003)

**User Story:** As a Cashier, I want to modify the quantities of products in the cart, to adjust the sale before proceeding to payment.

#### Acceptance Criteria

1. WHEN the Cashier increments the quantity of a CartItem, THE Store SHALL recalculate that item's subtotal immediately.
2. WHEN the Cashier reduces the quantity of a CartItem to `0`, THE Store SHALL remove that item from the Cart without requesting additional confirmation.
3. WHEN the Cart becomes empty as a result of reducing a quantity to `0`, THE System SHALL transition the UIState from `CARRITO_ACTIVO` to `RESULTADOS` automatically.
4. THE Cart SHALL reject negative or non-numeric quantity inputs in the modification controls.

---

### Requisito 5: Cálculo de IVA y total (SPEC-004)

**User Story:** Como Cajero, quiero ver el subtotal, el IVA y el total calculados automáticamente, para informar al cliente el monto exacto a pagar.

#### Criterios de Aceptación

1. THE Calculadora SHALL calcular `subtotal` como la suma de los subtotales de todos los ItemCarrito del Carrito.
2. THE Calculadora SHALL calcular `iva` como `Math.round(subtotal × IVA_RATE)`.
3. THE Calculadora SHALL calcular `total` como `subtotal + iva`.
4. WHEN el Carrito cambia, THE OrderSummary SHALL recalcular y mostrar los tres valores en tiempo real.
5. THE OrderSummary SHALL mostrar los montos con formato `$X.XXX` (prefijo `$`, separador de miles con punto).
6. THE OrderSummary SHALL be read-only; the Cashier cannot edit any field of the summary.

---

### Requirement 6: Payment Amount Entry and Change Calculation (SPEC-005)

**User Story:** As a Cashier, I want to enter the amount received from the customer and see the change calculated in real time, to speed up the checkout process.

#### Acceptance Criteria

1. WHEN the Cashier clicks "Proceed to payment", THE System SHALL transition the UIState from `CARRITO_ACTIVO` to `CALCULANDO_PAGO` and show the PaymentPanel.
2. WHEN the Cashier modifies the amount field in the PaymentPanel, THE Calculator SHALL calculate `cambio = montoPagado − total` and show it in real time.
3. WHILE `montoPagado < total`, THE PaymentPanel SHALL show the change in red with the label "Insufficient amount".
4. WHILE `montoPagado >= total`, THE PaymentPanel SHALL show the change in green.
5. WHILE `montoPagado < total`, THE PaymentPanel SHALL keep the "Confirm sale" button in disabled state.
6. THE PaymentPanel SHALL reject non-numeric values and negative values in the amount field.

---

### Requirement 7: Sale Confirmation (SPEC-006)

**User Story:** As a Cashier, I want to confirm the sale with one click, to register the transaction and get the change receipt.

#### Acceptance Criteria

1. WHEN the Cashier clicks "Confirm sale", THE System SHALL transition the UIState to `PROCESANDO` and invoke `IVentaPort.confirmar` with the Cart and the total.
2. WHILE the UIState is `PROCESANDO`, THE PaymentPanel SHALL show a loading indicator and keep the "Confirm sale" button disabled to prevent double submission.
3. WHEN `IVentaPort.confirmar` returns success, THE System SHALL transition the UIState to `VENTA_COMPLETA` and show the message "Sale completed! Change: $X.XXX".
4. WHEN the UIState is `VENTA_COMPLETA`, THE Store SHALL clear the Cart, query, montoPagado and cambio to their initial values.
5. WHEN 3 seconds have elapsed in the `VENTA_COMPLETA` UIState or the Cashier clicks "New sale", THE System SHALL transition the UIState to `IDLE`.
6. IF `IVentaPort.confirmar` fails, THEN THE System SHALL transition the UIState to `ERROR` with a descriptive failure message.

---

### Requirement 8: Global Error Handling (SPEC-007)

**User Story:** As a Cashier, I want system errors to be shown clearly and recoverably, so I can retry the operation without losing the sale context.

#### Acceptance Criteria

1. WHEN the UIState is `ERROR`, THE ErrorBanner SHALL be visible at the top of the screen.
2. WHILE the UIState is `ERROR`, THE System SHALL keep the rest of the interface visible and functional.
3. THE ErrorBanner SHALL show a user-readable message without exposing stack traces or internal technical messages.
4. THE ErrorBanner SHALL show a differentiated message for each error code defined in the system.
5. WHEN the Cashier clicks "Retry" in the ErrorBanner, THE System SHALL re-execute the last event that caused the error.
6. WHEN the Cashier manually closes the ErrorBanner, THE System SHALL clear the error and transition the UIState to the state prior to the error.

---

### Requirement 9: Shift Sales History (SPEC-008)

**User Story:** As a Cashier, I want to view the sales history of my shift, to verify previous transactions without interrupting the active sales flow.

#### Acceptance Criteria

1. WHEN the Cashier clicks "View history" from UIState `IDLE` or `RESULTADOS`, THE System SHALL save the current UIState in `estadoPrevio` and transition to `HISTORIAL`.
2. WHEN the UIState transitions to `HISTORIAL`, THE System SHALL invoke `IVentaHistorialPort.listar` and show the results in the SalesHistory.
3. THE SalesHistory SHALL show each sale with: `ventaId`, formatted date/time, total with format `$X.XXX` and item count.
4. WHEN `IVentaHistorialPort.listar` returns an empty list, THE SalesHistory SHALL show the message "No sales recorded in this shift".
5. IF `IVentaHistorialPort.listar` fails, THEN THE System SHALL transition the UIState to `ERROR` with code `HISTORIAL_NO_DISPONIBLE`.
6. WHEN the Cashier clicks "Back" in the SalesHistory, THE System SHALL restore the UIState to the value saved in `estadoPrevio` without modifying the active Cart.

---

### Requirement 10: User Authentication (SPEC-009)

**User Story:** As a system user, I want to authenticate with username and password, to access the functions corresponding to my role.

#### Acceptance Criteria

1. WHILE the username or password field of the LoginForm is empty, THE LoginForm SHALL keep the "Log in" button disabled.
2. WHEN the user clicks "Log in" with incorrect credentials, THE LoginForm SHALL show the message "Invalid username or password" without indicating which field is incorrect.
3. WHEN login is successful with role `CAJERO`, THE System SHALL transition the UIState to `IDLE` and show the sales screen.
4. WHEN login is successful with role `ADMIN`, THE System SHALL transition the UIState to `IDLE` and show the sales screen with additional access to Inventory and Reports.
5. THE System SHALL store the Session JWT token in application memory; THE System SHALL NOT store the token in `localStorage` or `sessionStorage`.
6. THE System SHALL include the JWT token in the `Authorization: Bearer <token>` header of each authenticated HTTP request.
7. IF the Session expires during application use, THEN THE System SHALL transition the UIState to `LOGIN` automatically.

---

### Requirement 11: Logout (SPEC-010)

**User Story:** As a system user, I want to log out securely, to protect system access at the end of my shift.

#### Acceptance Criteria

1. WHEN the user clicks "Log out", THE System SHALL invoke `IAuthPort.logout`, remove the JWT token from memory and transition the UIState to `LOGIN`.
2. WHEN logout completes, THE Store SHALL completely reset the state: Cart, query, history, montoPagado, cambio and Session to their initial values.
3. WHEN the UIState is `LOGIN` after logout, THE System SHALL prevent navigation back to the POS using the browser's "Back" button.

---

### Requirement 12: Sale Return (SPEC-011)

**User Story:** As a Cashier, I want to process the return of a completed sale, to refund the customer and restore the product stock.

#### Acceptance Criteria

1. WHEN the Cashier clicks "Return sale" from UIState `VENTA_COMPLETA` or from the SalesHistory, THE System SHALL transition the UIState to `DEVOLUCION` and show the RefundPanel with the complete sale summary.
2. THE RefundPanel SHALL show the amount to return formatted with format `$X.XXX` before the Cashier confirms.
3. WHEN the Cashier confirms the return, THE System SHALL invoke `IDevolucionPort.procesar` with the corresponding `ventaId`.
4. WHEN `IDevolucionPort.procesar` returns success, THE System SHALL transition the UIState to `IDLE` and show the message "Return processed. Return $X.XXX to the customer."
5. THE System SHALL allow returns only for sales with state `COMPLETADA`; a sale with state `DEVUELTA` cannot be returned again.
6. WHEN the return is successfully processed, THE System SHALL reflect the stock restoration of the returned products.
7. IF `IDevolucionPort.procesar` fails, THEN THE System SHALL transition the UIState to `ERROR` with a descriptive failure message.

---

### Requirement 13: Inventory Management (SPEC-012)

**User Story:** As an Admin, I want to manage the product catalog, to keep the inventory available to cashiers up to date.

#### Acceptance Criteria

1. WHEN a user with role `ADMIN` clicks "Inventory", THE System SHALL transition the UIState to `INVENTARIO` and show the InventoryPanel.
2. IF a user with role `CAJERO` attempts to transition the UIState to `INVENTARIO`, THEN THE System SHALL reject the transition and emit the error `ACCESO_DENEGADO`.
3. THE InventoryPanel SHALL show all products with: name, price, current stock and active/inactive status.
4. WHEN the Admin creates a product with a name that already exists in the catalog, THE System SHALL return the error `PRODUCTO_DUPLICADO` without creating the product.
5. WHILE the price field of the product form contains a non-positive or non-numeric value, THE InventoryPanel SHALL keep the "Save" button disabled.
6. WHEN the Admin deactivates a product, THE System SHALL hide that product from `IProductoPort.buscar` results for cashiers.
7. WHEN the Admin updates a product's stock, THE InventoryPanel SHALL reflect the new value in real time.

---

### Requirement 14: End-of-Day Reports (SPEC-013)

**User Story:** As an Admin, I want to generate end-of-day reports by date range, to audit sales and export data for accounting.

#### Acceptance Criteria

1. WHEN a user with role `ADMIN` clicks "Reports", THE System SHALL transition the UIState to `REPORTES` and show the ReportsPanel.
2. IF a user with role `CAJERO` attempts to transition the UIState to `REPORTES`, THEN THE System SHALL reject the transition and emit the error `ACCESO_DENEGADO`.
3. WHEN the Admin selects a date range and clicks "Generate", THE System SHALL invoke `IReportePort.generarCierre` and show the result in the ReportsPanel.
4. THE ReportsPanel SHALL show: total sales, total returns, gross amount, returned amount, net amount and sales-by-cashier table.
5. THE ReportsPanel SHALL show all amounts with format `$X.XXX`.
6. WHEN the Admin clicks "Export CSV", THE System SHALL invoke `IReportePort.exportarCSV` and download a file with the active report data.
7. WHEN `IReportePort.generarCierre` returns a report with no sales, THE ReportsPanel SHALL show the message "No sales in the selected period".

---

### Requirement 15: Multiple Payment Methods (SPEC-014)

**User Story:** As a Cashier, I want to select the customer's payment method (cash, card, transfer or mixed), to correctly record how the transaction was made.

#### Acceptance Criteria

1. WHEN the UIState is `CALCULANDO_PAGO`, THE PaymentPanel SHALL show a PaymentMethod selector with options: `EFECTIVO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`, `TRANSFERENCIA` and `MIXTO`.
2. WHEN the Cashier selects `EFECTIVO`, THE PaymentPanel SHALL maintain the real-time change calculation behavior defined in Requirement 6.
3. WHEN the Cashier selects `TARJETA_DEBITO`, `TARJETA_CREDITO` or `TRANSFERENCIA`, THE PaymentPanel SHALL enable the "Confirm sale" button only when the entered amount equals the total.
4. WHEN the Cashier selects `MIXTO`, THE PaymentPanel SHALL allow adding multiple payment rows, each with PaymentMethod and amount; THE PaymentPanel SHALL enable "Confirm sale" only when the sum of all amounts is greater than or equal to the total.
5. WHEN the active PaymentMethod does not include a cash component, THE PaymentPanel SHALL hide the change line.
6. THE Store SHALL include the PaymentMethod and the payments list (`PagoItem[]`) in the call to `IVentaPort.confirmar`.

---

### Requirement 16: Receipt Printing (SPEC-015)

**User Story:** As a Cashier, I want to print the sale receipt, to give the customer a physical proof of the transaction.

#### Acceptance Criteria

1. WHEN the UIState is `VENTA_COMPLETA`, THE System SHALL show the ReceiptButton available to the Cashier.
2. WHEN the Cashier clicks the ReceiptButton, THE System SHALL invoke `IImpresionPort.imprimir` with the `ventaId` of the completed sale.
3. THE ImpresionAdapter SHALL generate the receipt using `window.print()` with `@media print` styles that hide the rest of the interface during printing.
4. THE System SHALL generate the receipt with the following content: business name, sale date and time, Cashier name, `ventaId`, item list with name, quantity and subtotal, total subtotal, VAT, total, PaymentMethod and change.
5. WHEN the sale's PaymentMethod does not include a cash component, THE System SHALL omit the change line from the receipt.
6. THE System SHALL apply CSS print styles that guarantee receipt readability on 80mm wide paper.

---

### Requirement 17: Hexagonal Architecture and Domain Ports

**User Story:** As a system developer, I want the domain logic to be decoupled from infrastructure, to be able to test behavior in isolation and substitute adapters without modifying the domain.

#### Acceptance Criteria

1. THE System SHALL define the following ports in the domain layer: `IProductoPort`, `IVentaPort`, `IVentaHistorialPort`, `IAuthPort`, `IDevolucionPort`, `IInventarioPort`, `IReportePort` and `IImpresionPort`.
2. THE System SHALL provide mock adapters for each Port, usable in tests without a running backend.
3. THE System SHALL provide production adapters for each Port that communicate with the REST API at `VITE_API_BASE_URL`.
4. THE Calculator SHALL be a pure function without side effects; THE Calculator SHALL produce the same result for the same input arguments in any execution context.
5. WHERE the execution environment is testing, THE System SHALL inject mock adapters instead of production adapters.

---

### Requirement 18: Calculator Correctness Properties (Property-Based Testing)

**User Story:** As a system developer, I want to verify the mathematical properties of the Calculator with hundreds of randomly generated inputs, to guarantee that the VAT and change formulas are correct for any valid value.

#### Acceptance Criteria

1. FOR ALL values of `subtotal >= 0`, THE Calculator SHALL produce `iva = Math.round(subtotal × 0.19)`.
2. FOR ALL values of `subtotal >= 0`, THE Calculator SHALL produce `total = subtotal + Math.round(subtotal × 0.19)`.
3. FOR ALL values of `montoPagado` and `total`, THE Calculator SHALL produce `cambio = montoPagado − total`.
4. WHEN the Cart is empty, THE Calculator SHALL produce `{ subtotal: 0, iva: 0, total: 0 }`.
5. FOR ALL values of `precio >= 0` and `cantidad >= 0`, THE Calculator SHALL produce `calcularSubtotal(precio, cantidad) = precio × cantidad`.
6. THE System SHALL verify the above properties by running at least 100 randomly generated test cases per property using `fast-check`.
7. WHEN a property fails, THE System SHALL report the minimal counterexample that breaks it.

---

### Requirement 19: State Machine Correctness Properties (Property-Based Testing)

**User Story:** As a system developer, I want to verify that the Store state machine rejects invalid transitions for any combination of state and action, to guarantee the integrity of the UI flow.

#### Acceptance Criteria

1. FOR ALL valid UIStates and invalid transition actions for that state, THE Store SHALL keep the UIState unchanged.
2. FOR ALL valid action sequences that lead the Cart to be empty from `CARRITO_ACTIVO`, THE Store SHALL transition the UIState to `RESULTADOS`.
3. FOR ALL valid sale confirmation sequences, THE Store SHALL produce a `VENTA_COMPLETA` state with empty Cart, empty query and montoPagado equal to `0`.
4. THE System SHALL verify the above properties by running at least 100 randomly generated action sequences using `fast-check`.
