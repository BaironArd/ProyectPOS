# Documento de Requisitos — Frontend POS

## Introducción

El sistema **POS Frontend** es una aplicación web de punto de venta construida con React 18 + TypeScript 5. Permite a cajeros y administradores gestionar el ciclo completo de ventas: búsqueda de productos, construcción de carrito, cálculo de impuestos, procesamiento de pagos (efectivo, tarjeta, transferencia y mixto), confirmación de ventas, impresión de recibos, consulta de historial, devoluciones, gestión de inventario y reportes de cierre de caja.

La interfaz opera como una **máquina de estados finita** con 13 estados mutuamente excluyentes. La arquitectura sigue el patrón Hexagonal (Ports & Adapters): la capa de dominio define contratos (puertos), la capa de infraestructura los implementa (adaptadores), y la capa de aplicación orquesta el estado con Zustand.

---

## Glosario

- **Sistema**: La aplicación frontend POS en su conjunto.
- **Cajero**: Usuario autenticado con rol `CAJERO`. Puede realizar ventas, consultar historial y procesar devoluciones.
- **Admin**: Usuario autenticado con rol `ADMIN`. Tiene acceso a todas las funciones del Cajero más gestión de inventario y reportes.
- **Store**: El estado centralizado de la aplicación gestionado con Zustand (`usePOSStore`).
- **Calculadora**: Módulo de dominio puro (`calculadora.ts`) que implementa `calcularResumen`, `calcularCambio` y `calcularSubtotal`.
- **Puerto**: Interfaz de dominio que define un contrato de acceso a datos o servicios externos (ej. `IProductoPort`, `IVentaPort`).
- **Adaptador**: Implementación concreta de un Puerto en la capa de infraestructura.
- **Carrito**: Colección de `ItemCarrito` en el Store que representa los productos seleccionados para la venta en curso.
- **Resumen**: Objeto calculado con `subtotal`, `iva` y `total` derivado del Carrito.
- **Sesion**: Objeto que contiene `usuario`, `rol` y `token` JWT almacenado en memoria.
- **EstadoUI**: Tipo union que representa el estado activo de la máquina de estados: `LOGIN | IDLE | BUSCANDO | RESULTADOS | CARRITO_ACTIVO | CALCULANDO_PAGO | PROCESANDO | VENTA_COMPLETA | HISTORIAL | DEVOLUCION | INVENTARIO | REPORTES | ERROR`.
- **MetodoPago**: Tipo union de métodos de pago aceptados: `EFECTIVO | TARJETA_DEBITO | TARJETA_CREDITO | TRANSFERENCIA | MIXTO`.
- **IVA_RATE**: Constante de dominio con valor `0.19` (19%).
- **SearchBar**: Componente de búsqueda de productos.
- **ProductList**: Componente que renderiza la lista de productos encontrados.
- **Cart**: Componente que muestra los ítems del Carrito activo.
- **OrderSummary**: Componente de solo lectura que muestra Subtotal, IVA y Total.
- **PaymentPanel**: Componente que gestiona el ingreso de monto y la selección de método de pago.
- **ErrorBanner**: Componente transversal que muestra errores recuperables.
- **LoginForm**: Componente de autenticación con campos usuario y contraseña.
- **SalesHistory**: Componente que muestra el historial de ventas del turno.
- **RefundPanel**: Componente que gestiona el flujo de devolución de una venta.
- **InventoryPanel**: Componente de gestión de catálogo de productos (solo Admin).
- **ReportsPanel**: Componente de reportes de cierre de caja (solo Admin).
- **ReceiptButton**: Componente que dispara la impresión del recibo de venta.

---

## Requisitos

---

### Requisito 1: Máquina de estados de UI

**User Story:** Como desarrollador del sistema, quiero que la interfaz opere como una máquina de estados finita, para que las transiciones entre pantallas sean predecibles y verificables.

#### Criterios de Aceptación

1. THE Sistema SHALL mantener exactamente un EstadoUI activo en todo momento.
2. WHEN el usuario no tiene Sesion activa, THE Sistema SHALL establecer el EstadoUI en `LOGIN`.
3. WHEN el login es exitoso, THE Sistema SHALL transicionar el EstadoUI de `LOGIN` a `IDLE`.
4. WHEN el usuario cierra sesión, THE Sistema SHALL transicionar el EstadoUI a `LOGIN` y limpiar la Sesion.
5. WHEN ocurre un error recuperable en cualquier EstadoUI autenticado, THE Sistema SHALL transicionar el EstadoUI a `ERROR` preservando el contexto del error.
6. IF el Store recibe una acción de transición inválida (ej. `IDLE` → `PROCESANDO`), THEN THE Store SHALL ignorar la acción y mantener el EstadoUI sin cambios.
7. THE Sistema SHALL soportar las siguientes transiciones válidas: `LOGIN→IDLE`, `IDLE→BUSCANDO`, `BUSCANDO→RESULTADOS`, `RESULTADOS→CARRITO_ACTIVO`, `CARRITO_ACTIVO→CALCULANDO_PAGO`, `CALCULANDO_PAGO→PROCESANDO`, `PROCESANDO→VENTA_COMPLETA`, `VENTA_COMPLETA→IDLE`, `CARRITO_ACTIVO→RESULTADOS`, `IDLE→HISTORIAL`, `RESULTADOS→HISTORIAL`, `HISTORIAL→IDLE`, `HISTORIAL→RESULTADOS`, `VENTA_COMPLETA→DEVOLUCION`, `DEVOLUCION→IDLE`, `IDLE→INVENTARIO`, `INVENTARIO→IDLE`, `IDLE→REPORTES`, `REPORTES→IDLE`, `cualquier_estado_autenticado→ERROR`, `ERROR→IDLE`.

---

### Requisito 2: Búsqueda de productos (SPEC-001)

**User Story:** Como Cajero, quiero buscar productos por nombre o código, para encontrar rápidamente los artículos que el cliente desea comprar.

#### Criterios de Aceptación

1. WHEN el Cajero escribe menos de 2 caracteres en el SearchBar, THE Sistema SHALL mantener el EstadoUI en `IDLE` sin invocar `IProductoPort.buscar`.
2. WHEN el Cajero escribe 2 o más caracteres en el SearchBar, THE Sistema SHALL transicionar el EstadoUI a `BUSCANDO` e invocar `IProductoPort.buscar` con el texto ingresado.
3. WHILE el EstadoUI es `BUSCANDO`, THE SearchBar SHALL mostrar un indicador de carga visible.
4. WHEN `IProductoPort.buscar` retorna una lista de productos no vacía, THE Sistema SHALL transicionar el EstadoUI a `RESULTADOS` y renderizar los productos en el ProductList.
5. WHEN `IProductoPort.buscar` retorna una lista vacía, THE Sistema SHALL transicionar el EstadoUI a `RESULTADOS` y mostrar el mensaje "Sin resultados para '[query]'" en el ProductList.
6. IF `IProductoPort.buscar` falla con un error, THEN THE Sistema SHALL transicionar el EstadoUI a `ERROR` con código `LOAD_FAILED` y mensaje "No se pudieron cargar los productos. Intenta nuevamente."
7. THE SearchBar SHALL renderizar cada producto con nombre, precio formateado y botón "Agregar".
8. THE Sistema SHALL ejecutar la búsqueda sin recargar la página.

---

### Requisito 3: Agregar producto al Carrito (SPEC-002)

**User Story:** Como Cajero, quiero agregar productos al carrito con un clic, para construir la lista de artículos de la venta actual.

#### Criterios de Aceptación

1. WHEN el Cajero hace clic en "Agregar" sobre un producto con `stock > 0`, THE Store SHALL agregar el producto al Carrito con `cantidad: 1` si no existe, o incrementar `cantidad` en 1 si ya existe.
2. WHEN el Cajero agrega el primer ítem al Carrito, THE Sistema SHALL transicionar el EstadoUI de `RESULTADOS` a `CARRITO_ACTIVO`.
3. THE Cart SHALL mostrar cada ItemCarrito con columnas: Nombre, Precio unitario, Cantidad, Subtotal y acción Eliminar.
4. THE Store SHALL calcular `subtotal = precioUnitario × cantidad` para cada ItemCarrito en cada modificación del Carrito.
5. WHEN el stock de un producto es `0`, THE ProductList SHALL renderizar el botón "Agregar" de ese producto en estado desactivado.
6. THE Sistema SHALL mostrar un CartBadge en el encabezado con el número de ítems únicos del Carrito.

---

### Requisito 4: Modificar y eliminar ítems del Carrito (SPEC-003)

**User Story:** Como Cajero, quiero modificar las cantidades de los productos en el carrito, para ajustar la venta antes de proceder al pago.

#### Criterios de Aceptación

1. WHEN el Cajero incrementa la cantidad de un ItemCarrito, THE Store SHALL recalcular el subtotal de ese ítem inmediatamente.
2. WHEN el Cajero reduce la cantidad de un ItemCarrito a `0`, THE Store SHALL eliminar ese ítem del Carrito sin solicitar confirmación adicional.
3. WHEN el Carrito queda vacío como resultado de reducir una cantidad a `0`, THE Sistema SHALL transicionar el EstadoUI de `CARRITO_ACTIVO` a `RESULTADOS` automáticamente.
4. THE Cart SHALL rechazar entradas de cantidad negativas o no numéricas en los controles de modificación.

---

### Requisito 5: Cálculo de IVA y total (SPEC-004)

**User Story:** Como Cajero, quiero ver el subtotal, el IVA y el total calculados automáticamente, para informar al cliente el monto exacto a pagar.

#### Criterios de Aceptación

1. THE Calculadora SHALL calcular `subtotal` como la suma de los subtotales de todos los ItemCarrito del Carrito.
2. THE Calculadora SHALL calcular `iva` como `Math.round(subtotal × IVA_RATE)`.
3. THE Calculadora SHALL calcular `total` como `subtotal + iva`.
4. WHEN el Carrito cambia, THE OrderSummary SHALL recalcular y mostrar los tres valores en tiempo real.
5. THE OrderSummary SHALL mostrar los montos con formato `$X.XXX` (prefijo `$`, separador de miles con punto).
6. THE OrderSummary SHALL ser de solo lectura; el Cajero no puede editar ningún campo del resumen.

---

### Requisito 6: Ingreso de monto de pago y cálculo de cambio (SPEC-005)

**User Story:** Como Cajero, quiero ingresar el monto recibido del cliente y ver el cambio calculado en tiempo real, para agilizar el proceso de cobro.

#### Criterios de Aceptación

1. WHEN el Cajero hace clic en "Proceder al pago", THE Sistema SHALL transicionar el EstadoUI de `CARRITO_ACTIVO` a `CALCULANDO_PAGO` y mostrar el PaymentPanel.
2. WHEN el Cajero modifica el campo de monto en el PaymentPanel, THE Calculadora SHALL calcular `cambio = montoPagado − total` y mostrarlo en tiempo real.
3. WHILE `montoPagado < total`, THE PaymentPanel SHALL mostrar el cambio en color rojo con la etiqueta "Monto insuficiente".
4. WHILE `montoPagado >= total`, THE PaymentPanel SHALL mostrar el cambio en color verde.
5. WHILE `montoPagado < total`, THE PaymentPanel SHALL mantener el botón "Confirmar venta" en estado desactivado.
6. THE PaymentPanel SHALL rechazar valores no numéricos y valores negativos en el campo de monto.

---

### Requisito 7: Confirmación de venta (SPEC-006)

**User Story:** Como Cajero, quiero confirmar la venta con un clic, para registrar la transacción y obtener el comprobante de cambio.

#### Criterios de Aceptación

1. WHEN el Cajero hace clic en "Confirmar venta", THE Sistema SHALL transicionar el EstadoUI a `PROCESANDO` e invocar `IVentaPort.confirmar` con el Carrito y el total.
2. WHILE el EstadoUI es `PROCESANDO`, THE PaymentPanel SHALL mostrar un indicador de carga y mantener el botón "Confirmar venta" desactivado para prevenir doble envío.
3. WHEN `IVentaPort.confirmar` retorna éxito, THE Sistema SHALL transicionar el EstadoUI a `VENTA_COMPLETA` y mostrar el mensaje "¡Venta completada! Cambio: $X.XXX".
4. WHEN el EstadoUI es `VENTA_COMPLETA`, THE Store SHALL limpiar el Carrito, el query, el montoPagado y el cambio a sus valores iniciales.
5. WHEN han transcurrido 3 segundos en el EstadoUI `VENTA_COMPLETA` o el Cajero hace clic en "Nueva venta", THE Sistema SHALL transicionar el EstadoUI a `IDLE`.
6. IF `IVentaPort.confirmar` falla, THEN THE Sistema SHALL transicionar el EstadoUI a `ERROR` con un mensaje descriptivo del fallo.

---

### Requisito 8: Manejo de errores global (SPEC-007)

**User Story:** Como Cajero, quiero que los errores del sistema se muestren de forma clara y recuperable, para poder reintentar la operación sin perder el contexto de la venta.

#### Criterios de Aceptación

1. WHEN el EstadoUI es `ERROR`, THE ErrorBanner SHALL ser visible en la parte superior de la pantalla.
2. WHILE el EstadoUI es `ERROR`, THE Sistema SHALL mantener el resto de la interfaz visible y funcional.
3. THE ErrorBanner SHALL mostrar un mensaje legible por el usuario sin exponer stack traces ni mensajes técnicos internos.
4. THE ErrorBanner SHALL mostrar un mensaje diferenciado por cada código de error definido en el sistema.
5. WHEN el Cajero hace clic en "Reintentar" en el ErrorBanner, THE Sistema SHALL re-ejecutar el último evento que causó el error.
6. WHEN el Cajero cierra manualmente el ErrorBanner, THE Sistema SHALL limpiar el error y transicionar el EstadoUI al estado previo al error.

---

### Requisito 9: Historial de ventas del turno (SPEC-008)

**User Story:** Como Cajero, quiero consultar el historial de ventas de mi turno, para verificar transacciones anteriores sin interrumpir el flujo de ventas activo.

#### Criterios de Aceptación

1. WHEN el Cajero hace clic en "Ver historial" desde el EstadoUI `IDLE` o `RESULTADOS`, THE Sistema SHALL guardar el EstadoUI actual en `estadoPrevio` y transicionar a `HISTORIAL`.
2. WHEN el EstadoUI transiciona a `HISTORIAL`, THE Sistema SHALL invocar `IVentaHistorialPort.listar` y mostrar los resultados en el SalesHistory.
3. THE SalesHistory SHALL mostrar cada venta con: `ventaId`, fecha/hora formateada, total con formato `$X.XXX` y cantidad de ítems.
4. WHEN `IVentaHistorialPort.listar` retorna una lista vacía, THE SalesHistory SHALL mostrar el mensaje "No hay ventas registradas en este turno".
5. IF `IVentaHistorialPort.listar` falla, THEN THE Sistema SHALL transicionar el EstadoUI a `ERROR` con código `HISTORIAL_NO_DISPONIBLE`.
6. WHEN el Cajero hace clic en "Volver" en el SalesHistory, THE Sistema SHALL restaurar el EstadoUI al valor guardado en `estadoPrevio` sin modificar el Carrito activo.

---

### Requisito 10: Autenticación de usuario (SPEC-009)

**User Story:** Como usuario del sistema, quiero autenticarme con usuario y contraseña, para acceder a las funciones correspondientes a mi rol.

#### Criterios de Aceptación

1. WHILE el campo usuario o el campo contraseña del LoginForm están vacíos, THE LoginForm SHALL mantener el botón "Ingresar" desactivado.
2. WHEN el usuario hace clic en "Ingresar" con credenciales incorrectas, THE LoginForm SHALL mostrar el mensaje "Usuario o contraseña incorrectos" sin indicar cuál campo es incorrecto.
3. WHEN el login es exitoso con rol `CAJERO`, THE Sistema SHALL transicionar el EstadoUI a `IDLE` y mostrar la pantalla de ventas.
4. WHEN el login es exitoso con rol `ADMIN`, THE Sistema SHALL transicionar el EstadoUI a `IDLE` y mostrar la pantalla de ventas con acceso adicional a Inventario y Reportes.
5. THE Sistema SHALL almacenar el token JWT de la Sesion en memoria de la aplicación; THE Sistema SHALL NOT almacenar el token en `localStorage` ni en `sessionStorage`.
6. THE Sistema SHALL incluir el token JWT en el encabezado `Authorization: Bearer <token>` de cada petición HTTP autenticada.
7. IF la Sesion expira durante el uso de la aplicación, THEN THE Sistema SHALL transicionar el EstadoUI a `LOGIN` automáticamente.

---

### Requisito 11: Cierre de sesión (SPEC-010)

**User Story:** Como usuario del sistema, quiero cerrar sesión de forma segura, para proteger el acceso al sistema al finalizar mi turno.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en "Cerrar sesión", THE Sistema SHALL invocar `IAuthPort.logout`, eliminar el token JWT de memoria y transicionar el EstadoUI a `LOGIN`.
2. WHEN el cierre de sesión se completa, THE Store SHALL resetear completamente el estado: Carrito, query, historial, montoPagado, cambio y Sesion a sus valores iniciales.
3. WHEN el EstadoUI es `LOGIN` tras el cierre de sesión, THE Sistema SHALL prevenir la navegación de vuelta al POS mediante el botón "Atrás" del navegador.

---

### Requisito 12: Devolución de venta (SPEC-011)

**User Story:** Como Cajero, quiero procesar la devolución de una venta completada, para reembolsar al cliente y restaurar el stock de los productos.

#### Criterios de Aceptación

1. WHEN el Cajero hace clic en "Devolver venta" desde el EstadoUI `VENTA_COMPLETA` o desde el SalesHistory, THE Sistema SHALL transicionar el EstadoUI a `DEVOLUCION` y mostrar el RefundPanel con el resumen completo de la venta.
2. THE RefundPanel SHALL mostrar el monto a devolver formateado con el formato `$X.XXX` antes de que el Cajero confirme.
3. WHEN el Cajero confirma la devolución, THE Sistema SHALL invocar `IDevolucionPort.procesar` con el `ventaId` correspondiente.
4. WHEN `IDevolucionPort.procesar` retorna éxito, THE Sistema SHALL transicionar el EstadoUI a `IDLE` y mostrar el mensaje "Devolución procesada. Devolver $X.XXX al cliente."
5. THE Sistema SHALL permitir la devolución únicamente de ventas con estado `COMPLETADA`; una venta con estado `DEVUELTA` no puede ser devuelta nuevamente.
6. WHEN la devolución es procesada exitosamente, THE Sistema SHALL reflejar la restauración del stock de los productos devueltos.
7. IF `IDevolucionPort.procesar` falla, THEN THE Sistema SHALL transicionar el EstadoUI a `ERROR` con un mensaje descriptivo del fallo.

---

### Requisito 13: Gestión de inventario (SPEC-012)

**User Story:** Como Admin, quiero gestionar el catálogo de productos, para mantener actualizado el inventario disponible para los cajeros.

#### Criterios de Aceptación

1. WHEN un usuario con rol `ADMIN` hace clic en "Inventario", THE Sistema SHALL transicionar el EstadoUI a `INVENTARIO` y mostrar el InventoryPanel.
2. IF un usuario con rol `CAJERO` intenta transicionar el EstadoUI a `INVENTARIO`, THEN THE Sistema SHALL rechazar la transición y emitir el error `ACCESO_DENEGADO`.
3. THE InventoryPanel SHALL mostrar todos los productos con: nombre, precio, stock actual y estado activo/inactivo.
4. WHEN el Admin crea un producto con un nombre que ya existe en el catálogo, THE Sistema SHALL retornar el error `PRODUCTO_DUPLICADO` sin crear el producto.
5. WHILE el campo de precio del formulario de producto contiene un valor no positivo o no numérico, THE InventoryPanel SHALL mantener el botón "Guardar" desactivado.
6. WHEN el Admin desactiva un producto, THE Sistema SHALL ocultar ese producto de los resultados de `IProductoPort.buscar` para los cajeros.
7. WHEN el Admin actualiza el stock de un producto, THE InventoryPanel SHALL reflejar el nuevo valor en tiempo real.

---

### Requisito 14: Reportes de cierre de caja (SPEC-013)

**User Story:** Como Admin, quiero generar reportes de cierre de caja por rango de fechas, para auditar las ventas y exportar los datos para contabilidad.

#### Criterios de Aceptación

1. WHEN un usuario con rol `ADMIN` hace clic en "Reportes", THE Sistema SHALL transicionar el EstadoUI a `REPORTES` y mostrar el ReportsPanel.
2. IF un usuario con rol `CAJERO` intenta transicionar el EstadoUI a `REPORTES`, THEN THE Sistema SHALL rechazar la transición y emitir el error `ACCESO_DENEGADO`.
3. WHEN el Admin selecciona un rango de fechas y hace clic en "Generar", THE Sistema SHALL invocar `IReportePort.generarCierre` y mostrar el resultado en el ReportsPanel.
4. THE ReportsPanel SHALL mostrar: total de ventas, total de devoluciones, monto bruto, monto devuelto, monto neto y tabla de ventas por cajero.
5. THE ReportsPanel SHALL mostrar todos los montos con formato `$X.XXX`.
6. WHEN el Admin hace clic en "Exportar CSV", THE Sistema SHALL invocar `IReportePort.exportarCSV` y descargar un archivo con los datos del reporte activo.
7. WHEN `IReportePort.generarCierre` retorna un reporte sin ventas, THE ReportsPanel SHALL mostrar el mensaje "Sin ventas en el período seleccionado".

---

### Requisito 15: Múltiples métodos de pago (SPEC-014)

**User Story:** Como Cajero, quiero seleccionar el método de pago del cliente (efectivo, tarjeta, transferencia o mixto), para registrar correctamente la forma en que se realizó la transacción.

#### Criterios de Aceptación

1. WHEN el EstadoUI es `CALCULANDO_PAGO`, THE PaymentPanel SHALL mostrar un selector de MetodoPago con las opciones: `EFECTIVO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`, `TRANSFERENCIA` y `MIXTO`.
2. WHEN el Cajero selecciona `EFECTIVO`, THE PaymentPanel SHALL mantener el comportamiento de cálculo de cambio en tiempo real definido en el Requisito 6.
3. WHEN el Cajero selecciona `TARJETA_DEBITO`, `TARJETA_CREDITO` o `TRANSFERENCIA`, THE PaymentPanel SHALL habilitar el botón "Confirmar venta" únicamente cuando el monto ingresado es igual al total.
4. WHEN el Cajero selecciona `MIXTO`, THE PaymentPanel SHALL permitir agregar múltiples filas de pago, cada una con MetodoPago y monto; THE PaymentPanel SHALL habilitar "Confirmar venta" únicamente cuando la suma de todos los montos es mayor o igual al total.
5. WHEN el MetodoPago activo no incluye componente de efectivo, THE PaymentPanel SHALL ocultar la línea de cambio.
6. THE Store SHALL incluir el MetodoPago y la lista de pagos (`PagoItem[]`) en la llamada a `IVentaPort.confirmar`.

---

### Requisito 16: Impresión de recibo (SPEC-015)

**User Story:** Como Cajero, quiero imprimir el recibo de la venta, para entregar al cliente un comprobante físico de la transacción.

#### Criterios de Aceptación

1. WHEN el EstadoUI es `VENTA_COMPLETA`, THE Sistema SHALL mostrar el ReceiptButton disponible para el Cajero.
2. WHEN el Cajero hace clic en el ReceiptButton, THE Sistema SHALL invocar `IImpresionPort.imprimir` con el `ventaId` de la venta completada.
3. THE ImpresionAdapter SHALL generar el recibo usando `window.print()` con estilos `@media print` que ocultan el resto de la interfaz durante la impresión.
4. THE Sistema SHALL generar el recibo con el siguiente contenido: nombre del negocio, fecha y hora de la venta, nombre del Cajero, `ventaId`, lista de ítems con nombre, cantidad y subtotal, subtotal total, IVA, total, MetodoPago y cambio.
5. WHEN el MetodoPago de la venta no incluye componente de efectivo, THE Sistema SHALL omitir la línea de cambio del recibo.
6. THE Sistema SHALL aplicar estilos CSS de impresión que garanticen la legibilidad del recibo en papel de 80mm de ancho.

---

### Requisito 17: Arquitectura hexagonal y puertos de dominio

**User Story:** Como desarrollador del sistema, quiero que la lógica de dominio esté desacoplada de la infraestructura, para poder testear el comportamiento en aislamiento y sustituir adaptadores sin modificar el dominio.

#### Criterios de Aceptación

1. THE Sistema SHALL definir los siguientes puertos en la capa de dominio: `IProductoPort`, `IVentaPort`, `IVentaHistorialPort`, `IAuthPort`, `IDevolucionPort`, `IInventarioPort`, `IReportePort` e `IImpresionPort`.
2. THE Sistema SHALL proveer adaptadores mock para cada Puerto, utilizables en tests sin necesidad de un backend activo.
3. THE Sistema SHALL proveer adaptadores de producción para cada Puerto que se comuniquen con la API REST en `VITE_API_BASE_URL`.
4. THE Calculadora SHALL ser una función pura sin efectos secundarios; THE Calculadora SHALL producir el mismo resultado para los mismos argumentos de entrada en cualquier contexto de ejecución.
5. WHERE el entorno de ejecución es de pruebas, THE Sistema SHALL inyectar los adaptadores mock en lugar de los adaptadores de producción.

---

### Requisito 18: Propiedades de corrección de la Calculadora (Property-Based Testing)

**User Story:** Como desarrollador del sistema, quiero verificar las propiedades matemáticas de la Calculadora con cientos de entradas generadas aleatoriamente, para garantizar que las fórmulas de IVA y cambio son correctas para cualquier valor válido.

#### Criterios de Aceptación

1. FOR ALL valores de `subtotal >= 0`, THE Calculadora SHALL producir `iva = Math.round(subtotal × 0.19)`.
2. FOR ALL valores de `subtotal >= 0`, THE Calculadora SHALL producir `total = subtotal + Math.round(subtotal × 0.19)`.
3. FOR ALL valores de `montoPagado` y `total`, THE Calculadora SHALL producir `cambio = montoPagado − total`.
4. WHEN el Carrito está vacío, THE Calculadora SHALL producir `{ subtotal: 0, iva: 0, total: 0 }`.
5. FOR ALL valores de `precio >= 0` y `cantidad >= 0`, THE Calculadora SHALL producir `calcularSubtotal(precio, cantidad) = precio × cantidad`.
6. THE Sistema SHALL verificar las propiedades anteriores ejecutando al menos 100 casos de prueba generados aleatoriamente por propiedad usando `fast-check`.
7. WHEN una propiedad falla, THE Sistema SHALL reportar el contraejemplo mínimo que la rompe.

---

### Requisito 19: Propiedades de corrección de la máquina de estados (Property-Based Testing)

**User Story:** Como desarrollador del sistema, quiero verificar que la máquina de estados del Store rechaza transiciones inválidas para cualquier combinación de estado y acción, para garantizar la integridad del flujo de UI.

#### Criterios de Aceptación

1. FOR ALL EstadoUI válidos y acciones de transición inválidas para ese estado, THE Store SHALL mantener el EstadoUI sin cambios.
2. FOR ALL secuencias válidas de acciones que llevan al Carrito a estar vacío desde `CARRITO_ACTIVO`, THE Store SHALL transicionar el EstadoUI a `RESULTADOS`.
3. FOR ALL secuencias válidas de confirmación de venta, THE Store SHALL producir un estado `VENTA_COMPLETA` con Carrito vacío, query vacío y montoPagado igual a `0`.
4. THE Sistema SHALL verificar las propiedades anteriores ejecutando al menos 100 secuencias de acciones generadas aleatoriamente usando `fast-check`.
