# ProyectPOS — Sistema de Punto de Venta

Sistema completo de punto de venta (POS) con arquitectura hexagonal, desarrollado con **React 18 + TypeScript** en el frontend y **Java 21 + Spring Boot 3** en el backend.

---

## Tabla de contenidos

- [Vista general](#vista-general)
- [Arquitectura](#arquitectura)
- [Frontend](#frontend)
- [Backend](#backend)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Flujos principales](#flujos-principales)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)

---

## Vista general

ProyectPOS es un sistema de punto de venta diseñado para cajeros y administradores. Permite gestionar el ciclo completo de ventas: búsqueda de productos, construcción de carrito, procesamiento de pagos (efectivo, tarjeta, transferencia y mixto), confirmación de ventas, impresión de recibos, historial de ventas, devoluciones, gestión de inventario y reportes de cierre de caja.

> **[imagen de pantalla principal del POS — vista del cajero con búsqueda y carrito]** <img width="1871" height="955" alt="image" src="https://github.com/user-attachments/assets/de80d968-efc1-4000-8d69-f8735b46d5db" />


---

## Arquitectura

El sistema sigue el patrón **Hexagonal (Ports & Adapters)** tanto en frontend como en backend. El dominio no depende de ningún framework externo — ni de Spring, ni de React, ni de JPA.

### Arquitectura general del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)             │
│   UI → Application (Zustand) → Domain → Infrastructure      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST (JSON)
                           │ Authorization: Bearer JWT
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (Java + Spring Boot)              │
│   Controllers → Use Cases → Domain Services → JPA Adapters  │
└─────────────────────────────────────────────────────────────┘
```

> **[imagen del diagrama de arquitectura hexagonal completo]**

---

## Frontend

### Tecnologías

| Herramienta | Versión | Propósito |
|---|---|---|
| React | 18.x | Framework de UI |
| TypeScript | 5.x | Tipado estático |
| Vite | 5.x | Bundler y servidor de desarrollo |
| Zustand | 4.x | Estado global centralizado |
| Vitest | 1.x | Tests unitarios |
| fast-check | 3.x | Property-Based Testing |

### Arquitectura frontend

```
src/
├── domain/          ← tipos, puertos, calculadora (sin React)
├── application/     ← store Zustand + hooks
├── infrastructure/  ← adaptadores HTTP + mocks
└── ui/              ← componentes React
```

> **[imagen de la arquitectura hexagonal del frontend con las 4 capas]**

### Máquina de estados de UI

La interfaz opera como una máquina de estados finita con 13 estados mutuamente excluyentes:

```
LOGIN → IDLE → BUSCANDO → RESULTADOS → CARRITO_ACTIVO
     → CALCULANDO_PAGO → PROCESANDO → VENTA_COMPLETA
     → HISTORIAL / DEVOLUCION / INVENTARIO / REPORTES / ERROR
```

> **[imagen del diagrama de estados de la máquina de estados del frontend]**

### Pantallas principales

#### Pantalla de login
> **[imagen de la pantalla de login con campos usuario y contraseña]**

#### Flujo de venta — Búsqueda y carrito
> **[imagen del flujo principal: SearchBar + ProductList + Cart + OrderSummary]**

#### Panel de pago
> **[imagen del PaymentPanel con selector de método de pago y cálculo de cambio]**

#### Venta completada
> **[imagen de la pantalla de venta completada con mensaje de éxito y botón de recibo]**

#### Historial de ventas
> **[imagen del componente SalesHistory con tabla de ventas del turno]**

#### Panel de inventario (Admin)
> **[imagen del InventoryPanel con tabla de productos y modal de edición]**

#### Reportes de cierre de caja (Admin)
> **[imagen del ReportsPanel con selector de fechas y resumen de ventas]**

---

## Backend

### Tecnologías

| Herramienta | Versión | Propósito |
|---|---|---|
| Java | 21 LTS | Runtime |
| Spring Boot | 3.2.x | Framework de aplicación |
| Spring Data JPA | 3.2.x | Persistencia |
| Spring Security | 6.x | Autenticación JWT |
| H2 Database | 2.x | Base de datos en memoria (dev) |
| PostgreSQL | 15.x | Base de datos de producción |
| jqwik | 1.8.x | Property-Based Testing |

### Arquitectura backend

```
infrastructure/adapter/in/web/    ← Controllers REST
domain/port/in/                   ← Use Cases (interfaces)
domain/service/                   ← Servicios POJO (sin Spring)
domain/port/out/                  ← Repositorios (interfaces)
infrastructure/adapter/out/       ← JPA Adapters
```

> **[imagen del diagrama de arquitectura hexagonal del backend con las capas]**

### Endpoints principales

| Método | Endpoint | Descripción | Rol |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Autenticación JWT | Público |
| `POST` | `/api/v1/auth/logout` | Cerrar sesión | Autenticado |
| `GET` | `/api/v1/productos?q=` | Buscar productos | Autenticado |
| `GET` | `/api/v1/productos/{id}` | Obtener producto | Autenticado |
| `POST` | `/api/v1/ventas` | Confirmar venta | Autenticado |
| `GET` | `/api/v1/ventas/{id}` | Obtener venta | Autenticado |
| `GET` | `/api/v1/ventas` | Historial paginado | Autenticado |
| `POST` | `/api/v1/ventas/{id}/devolucion` | Devolver venta | Autenticado |
| `GET` | `/api/v1/admin/productos` | Listar inventario | ADMIN |
| `POST` | `/api/v1/admin/productos` | Crear producto | ADMIN |
| `PUT` | `/api/v1/admin/productos/{id}` | Editar producto | ADMIN |
| `PATCH` | `/api/v1/admin/productos/{id}/toggle` | Activar/desactivar | ADMIN |
| `GET` | `/api/v1/reportes/cierre` | Reporte de caja | ADMIN |

### Formato de respuesta

**Éxito:**
```json
{
  "data": { },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error:**
```json
{
  "error": {
    "codigo": "PRODUCTO_NO_ENCONTRADO",
    "mensaje": "No existe un producto con id 99.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

> **[imagen del diagrama de secuencia de confirmación de venta (POST /api/v1/ventas)]**

---

## Usuarios de prueba

| Usuario | Contraseña | Rol | Acceso |
|---|---|---|---|
| `cajero01` | `1234` | CAJERO | Ventas, historial, devoluciones |
| `cajero02` | `1234` | CAJERO | Ventas, historial, devoluciones |
| `admin01` | `admin123` | ADMIN | Todo + inventario + reportes |

---

## Instalación y ejecución

### Requisitos previos

- Node.js 20 LTS
- Java 21 LTS
- Maven 3.9.x

### Frontend

```powershell
cd PROYECTPOS\frontend\pos-frontend
npm install
npm run dev
```

Espera hasta ver: `Local: http://localhost:5173/`

La aplicación estará disponible en `http://localhost:5173`

### Backend

```powershell
cd PROYECTPOS\backend\pos-backend
.\mvnw.cmd spring-boot:run
```

Espera hasta ver: `Started PosBackendApplication in X seconds`

La API estará disponible en `http://localhost:8080`

La consola H2 (base de datos en memoria) estará en `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:posdb`
- Usuario: `sa`
- Contraseña: *(vacía)*

### Ejecutar tests

```bash
# Frontend
cd PROYECTPOS/frontend/pos-frontend
npm run test

# Backend
cd PROYECTPOS/backend/pos-backend
mvn test
```

---

## Flujos principales

### Flujo de venta completo

```
1. Cajero inicia sesión (cajero01 / 1234)
2. Busca productos en el SearchBar (mínimo 2 caracteres)
3. Agrega productos al carrito
4. Ajusta cantidades si es necesario
5. Hace clic en "Proceder al pago"
6. Selecciona método de pago e ingresa monto
7. Confirma la venta
8. Imprime el recibo (opcional)
```

> **[imagen del flujo completo de venta paso a paso]**

### Flujo de devolución

```
1. Desde "Venta completada" o desde el Historial
2. Clic en "Devolver venta"
3. Confirmar devolución
4. El stock se restaura automáticamente
```

### Flujo de gestión de inventario (Admin)

```
1. Admin inicia sesión (admin01 / admin123)
2. Clic en "Inventario" en el menú
3. Crear, editar o desactivar productos
4. Los productos desactivados no aparecen en búsquedas del cajero
```

---

## Stack tecnológico

### Frontend
- **React 18** + **TypeScript 5** — UI reactiva con tipado estático
- **Zustand 4** — Estado global con máquina de estados finita
- **Vite 5** — Build tool y servidor de desarrollo
- **CSS Modules** — Estilos encapsulados por componente
- **Vitest + fast-check** — Tests unitarios y Property-Based Testing

### Backend
- **Java 21** + **Spring Boot 3** — API REST robusta
- **Spring Data JPA** + **H2/PostgreSQL** — Persistencia con ORM
- **Spring Security** + **JWT (jjwt)** — Autenticación stateless
- **Arquitectura Hexagonal** — Dominio desacoplado del framework
- **jqwik** — Property-Based Testing del dominio

---

## Estructura del proyecto

```
ProyectPOS/
├── PROYECTPOS/
│   ├── frontend/
│   │   ├── pos-frontend/          ← Aplicación React
│   │   │   ├── src/
│   │   │   │   ├── domain/        ← Tipos, puertos, calculadora
│   │   │   │   ├── application/   ← Store Zustand + hooks
│   │   │   │   ├── infrastructure/← Adaptadores HTTP + mocks
│   │   │   │   └── ui/            ← Componentes React
│   │   │   └── package.json
│   │   ├── diseno.md
│   │   ├── especificaciones.md
│   │   └── tareas.md
│   │
│   └── backend/
│       ├── pos-backend/           ← API Spring Boot
│       │   ├── src/main/java/com/pos/
│       │   │   ├── domain/        ← Entidades, servicios, puertos
│       │   │   └── infrastructure/← Controllers, JPA, Security
│       │   └── pom.xml
│       ├── diseno_backend.md
│       ├── especificaciones_backend.md
│       └── tareas_backend.md
│
└── README.md
```

---

## Decisiones de diseño clave

| Decisión | Justificación |
|---|---|
| Arquitectura Hexagonal | El dominio no depende de Spring ni de React — testeable en aislamiento |
| JWT en memoria (frontend) | Evita vulnerabilidades XSS de localStorage |
| Máquina de estados (frontend) | Transiciones predecibles y verificables entre pantallas |
| Calculadora como función pura | Candidata a Property-Based Testing — mismas fórmulas en frontend y backend |
| Optimistic Locking (`@Version`) | Previene inconsistencias de stock en ventas concurrentes |
| Adaptadores intercambiables | Mocks en tests, adaptadores reales en producción — sin cambiar el dominio |

---

## Licencia

MIT — Proyecto académico / de demostración.
