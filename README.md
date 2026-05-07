# ProyectPOS — Sistema de Punto de Venta

Sistema completo de punto de venta (POS) con arquitectura hexagonal, desarrollado con **React 18 + TypeScript** en el frontend y **Java 21 + Spring Boot 3** en el backend.

---

## Tabla de contenidos

- [Vista general](#vista-general)
- [Arquitectura](#arquitectura)
- [Características](#características)
- [Quick Start](#quick-start)
- [Instalación y desarrollo](#instalación-y-desarrollo)
- [Despliegue](#despliegue)
- [Usuarios de prueba](#usuarios-de-prueba)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contribución](#contribución)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Licencia](#licencia)

---

## Vista general

ProyectPOS es un sistema de punto de venta diseñado para cajeros y administradores. Permite gestionar el ciclo completo de ventas: búsqueda de productos, construcción de carrito, procesamiento de pagos (efectivo, tarjeta, transferencia y mixto), confirmación de ventas, impresión de recibos, historial de ventas, devoluciones, gestión de inventario y reportes de cierre de caja.

### Capturas de pantalla

*Vista principal del POS - búsqueda y carrito*
<img width="1868" height="946" alt="image" src="https://github.com/user-attachments/assets/6d585d84-e7d9-4b6d-810a-88704864b2a4" />


*Diagrama de arquitectura hexagonal*
<img width="1408" height="768" alt="Gemini_Generated_Image_1utzih1utzih1utz" src="https://github.com/user-attachments/assets/02a67800-272b-4b6d-9d24-84a2f97f207c" />


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

### Principios de diseño

- **Hexagonal Architecture**: Separación clara entre dominio, aplicación e infraestructura
- **Domain-Driven Design**: Modelo de dominio rico con lógica de negocio
- **Clean Code**: Código legible, mantenible y bien documentado
- **Test-Driven Development**: Cobertura de tests alta con pruebas unitarias e integración

---

## Características

### ✅ Funcionalidades implementadas

- **Autenticación JWT** con roles (CAJERO, ADMIN)
- **Búsqueda de productos** por nombre/descripción
- **Gestión de carrito** con cálculo automático de totales
- **Múltiples métodos de pago** (efectivo, tarjeta, transferencia, mixto)
- **Confirmación de ventas** con validación de stock
- **Impresión de recibos** (PDF/ticket)
- **Historial de ventas** con filtros y paginación
- **Sistema de devoluciones** con validación de tiempo
- **Gestión de inventario** (solo ADMIN)
- **Reportes de ventas** por período
- **Interfaz responsive** optimizada para tablets

### 🚧 Próximas funcionalidades (Roadmap)

- Dashboard con métricas en tiempo real
- Integración con lectores de código de barras
- Sistema de descuentos y promociones
- Multi-tienda con sincronización
- API para integraciones de terceros

---

## Quick Start

### Con Docker (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/your-repo/pos.git
cd pos

# Iniciar servicios
docker-compose up -d

# Acceder a la aplicación
# Frontend: http://localhost:80
# Backend API: http://localhost:8080
# Base de datos: localhost:5432
```

### Sin Docker (Desarrollo)

```bash
# Backend
cd PROYECTPOS/backend/pos-backend
mvn spring-boot:run

# Frontend (nueva terminal)
cd PROYECTPOS/frontend/pos-frontend
npm install
npm run dev
```

---

## Instalación y desarrollo

### Prerrequisitos

- **Java 21** (Eclipse Temurin recomendado)
- **Node.js 20+** con npm
- **PostgreSQL 15** (desarrollo) / Docker (opcional)
- **Git**

### Configuración del entorno

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/your-repo/pos.git
   cd pos
   ```

2. **Backend - Configuración**
   ```bash
   cd PROYECTPOS/backend/pos-backend
   
   # Crear base de datos PostgreSQL
   createdb posdb
   
   # Variables de entorno (crear .env)
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Frontend - Configuración**
   ```bash
   cd PROYECTPOS/frontend/pos-frontend
   npm install
   cp .env.development .env.local  # Si es necesario
   ```

4. **Ejecutar en desarrollo**
   ```bash
   # Backend
   cd PROYECTPOS/backend/pos-backend
   mvn spring-boot:run
   
   # Frontend (terminal separada)
   cd PROYECTPOS/frontend/pos-frontend
   npm run dev
   ```

### Comandos útiles

```bash
# Backend
mvn clean compile          # Compilar
mvn test                   # Ejecutar tests
mvn spring-boot:run        # Ejecutar aplicación
mvn verify                 # Build completo con tests

# Frontend
npm run dev                # Desarrollo con hot reload
npm run build              # Build de producción
npm run test               # Ejecutar tests
npm run test:coverage      # Tests con cobertura
npm run lint               # Linting
```

---

## Despliegue

### Producción con Docker

```bash
# Build de imágenes
docker build -t pos-backend ./PROYECTPOS/backend/pos-backend
docker build -t pos-frontend ./PROYECTPOS/frontend/pos-frontend

# Ejecutar con docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de entorno requeridas

```bash
# Base de datos
DB_URL=jdbc:postgresql://host:5432/posdb
DB_USER=pos_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRATION=28800

# CORS (producción)
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Checklist de despliegue

- [ ] Configurar HTTPS/TLS
- [ ] Configurar base de datos PostgreSQL
- [ ] Ejecutar migraciones de base de datos
- [ ] Configurar variables de entorno
- [ ] Configurar logging rotativo
- [ ] Configurar monitoreo (Prometheus/Grafana)
- [ ] Configurar backups automáticos
- [ ] Probar funcionalidad crítica

---

## Usuarios de prueba

| Usuario | Contraseña | Rol | Descripción |
|---------|------------|-----|-------------|
| `cajero01` | `1234` | CAJERO | Cajero básico |
| `cajero02` | `1234` | CAJERO | Cajero básico |
| `admin01` | `admin123` | ADMIN | Administrador completo |

---

## API Documentation

### Swagger UI
Accede a la documentación interactiva en: `http://localhost:8080/swagger-ui.html`

### Endpoints principales

```
POST /api/v1/auth/login          # Autenticación
GET  /api/v1/productos           # Búsqueda de productos
POST /api/v1/ventas              # Confirmar venta
GET  /api/v1/ventas/historial    # Historial de ventas
POST /api/v1/devoluciones        # Procesar devolución
GET  /api/v1/reportes/ventas     # Reportes de ventas
```

### Autenticación
Todos los endpoints (excepto login) requieren header:
```
Authorization: Bearer <jwt_token>
```

---

## Testing

### Cobertura actual
- **Backend**: ~85% (dominio: 90%, infraestructura: 70%)
- **Frontend**: ~75% (dominio: 100%, UI: 70%)

### Ejecutar tests

```bash
# Backend
cd PROYECTPOS/backend/pos-backend
mvn test

# Frontend
cd PROYECTPOS/frontend/pos-frontend
npm run test
npm run test:e2e  # Si implementado
```

### Tipos de tests
- **Unitarios**: Lógica de dominio pura
- **Integración**: Controladores y adaptadores
- **E2E**: Flujos completos de usuario (planeado)

---

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Guías de desarrollo
- Sigue la arquitectura hexagonal
- Mantén cobertura de tests > 80%
- Usa conventional commits
- Documenta cambios significativos

---

## Stack tecnológico

### Backend
- **Java 21** (Eclipse Temurin)
- **Spring Boot 3.2** (Web, Security, Data JPA, Validation)
- **PostgreSQL 15** / **H2** (testing)
- **JWT** (autenticación)
- **Maven** (build tool)
- **Flyway** (migrations - planeado)

### Frontend
- **React 18** con TypeScript
- **Vite** (build tool)
- **Zustand** (state management)
- **React Router** (navegación)
- **Axios** (HTTP client)
- **Vitest** (testing)
- **ESLint + Prettier** (code quality)

### DevOps
- **Docker & Docker Compose**
- **GitHub Actions** (CI/CD - planeado)
- **Prometheus + Grafana** (monitoring - planeado)
- **PostgreSQL** (base de datos)

---

## Estructura del proyecto

```
PROYECTPOS/
├── backend/
│   ├── .kiro/specs/          # Spec docs (design, requirements, tasks)
│   └── pos-backend/
│       ├── src/main/java/com/pos/
│       │   ├── domain/           # Pure business logic
│       │   ├── infrastructure/   # External adapters
│       │   └── config/           # Spring configuration
│       └── src/test/             # Tests
├── frontend/
│   ├── .kiro/specs/          # Spec docs (design, requirements, tasks)
│   └── pos-frontend/
│       ├── src/
│       │   ├── domain/           # Types and pure logic
│       │   ├── application/      # Hooks and store
│       │   ├── infrastructure/   # HTTP adapters
│       │   └── ui/               # React components
│       └── tests/                # Frontend tests
└── docs/                         # General documentation
```

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## Soporte

Para soporte técnico o preguntas:
- 📧 Email: support@pos-project.com
- 📖 Documentación: [docs/](docs/)
- 🐛 Reportar bugs: [GitHub Issues](https://github.com/your-repo/pos/issues)

## 📚 Documentación

- **[Guía de Desarrollo](docs/DEVELOPMENT.md)** - Setup completo, arquitectura y flujo de trabajo
- **[Solución de Problemas](docs/TROUBLESHOOTING.md)** - Diagnóstico y resolución de issues comunes
- **[Referencia de API](docs/API_REFERENCE.md)** - Documentación completa de endpoints
- **[Guía de Testing](docs/TESTING.md)** - Estrategias y mejores prácticas
- **[Despliegue](docs/DEPLOYMENT.md)** - Configuración para producción

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

<img width="1408" height="768" alt="Gemini_Generated_Image_cc5vi0cc5vi0cc5v" src="https://github.com/user-attachments/assets/6aba8d6c-c77d-48a1-b0c1-808bb4ab9237" />

### Máquina de estados de UI

La interfaz opera como una máquina de estados finita con 13 estados mutuamente excluyentes:

```
LOGIN → IDLE → BUSCANDO → RESULTADOS → CARRITO_ACTIVO
     → CALCULANDO_PAGO → PROCESANDO → VENTA_COMPLETA
     → HISTORIAL / DEVOLUCION / INVENTARIO / REPORTES / ERROR
```

<img width="1408" height="768" alt="Gemini_Generated_Image_lxzdwvlxzdwvlxzd" src="https://github.com/user-attachments/assets/114f76bf-3909-44bc-8d25-57cd545c3156" />

### Pantallas principales

#### Pantalla de login
<img width="1868" height="950" alt="image" src="https://github.com/user-attachments/assets/8d6987a4-313f-4e9a-a7d1-b7744fc1b8af" />


#### Flujo de venta — Búsqueda y carrito
<img width="1861" height="946" alt="image" src="https://github.com/user-attachments/assets/b66e894e-7d9c-4551-955f-a7649c02fad9" />


#### Panel de pago
<img width="1867" height="946" alt="image" src="https://github.com/user-attachments/assets/c6451123-230c-4a46-b8a4-6cb886aee9ec" />


#### Venta completada
<img width="1868" height="949" alt="image" src="https://github.com/user-attachments/assets/c0a6f869-5302-4136-aad5-3484b81d4e74" />


#### Historial de ventas
<img width="1865" height="944" alt="image" src="https://github.com/user-attachments/assets/55f08a58-b52b-425a-999c-1e29d5052010" />


#### Panel de inventario (Admin)
<img width="1870" height="952" alt="image" src="https://github.com/user-attachments/assets/f7e96fd3-f5e0-4a86-bb55-45bf6d81fca8" />


#### Reportes de cierre de caja (Admin)
<img width="1865" height="951" alt="image" src="https://github.com/user-attachments/assets/70516ae3-79b0-49ff-9855-99f86afff2a4" />


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

<img width="1408" height="768" alt="Gemini_Generated_Image_1utzih1utzih1utz" src="https://github.com/user-attachments/assets/255d0c82-287f-4878-9e29-4a9dbad60aa7" />

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

<img width="1408" height="768" alt="Gemini_Generated_Image_yc424uyc424uyc42" src="https://github.com/user-attachments/assets/8dde2cc9-e013-4b90-9562-2164d0a8bc83" />

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
│   │   ├── .kiro/
│   │   │   └── specs/             ← Spec docs (design, requirements, tasks)
│   │   └── pos-frontend/          ← React application
│   │       ├── src/
│   │       │   ├── domain/        ← Types, ports, calculator
│   │       │   ├── application/   ← Zustand store + hooks
│   │       │   ├── infrastructure/← HTTP adapters + mocks
│   │       │   └── ui/            ← React components
│   │       └── package.json
│   │
│   └── backend/
│       ├── .kiro/
│       │   └── specs/             ← Spec docs (design, requirements, tasks)
│       └── pos-backend/           ← Spring Boot API
│           ├── src/main/java/com/pos/
│           │   ├── domain/        ← Entities, services, ports
│           │   └── infrastructure/← Controllers, JPA, Security
│           └── pom.xml
│
├── docs/                          ← General documentation
├── docker-compose.yml
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
