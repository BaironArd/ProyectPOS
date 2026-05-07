# Guía de Desarrollo - POS System

## 🚀 Inicio Rápido

### Prerrequisitos
- **Java 21** (Eclipse Temurin recomendado)
- **Node.js 20+** con npm
- **PostgreSQL 15** (opcional para desarrollo local)
- **Docker & Docker Compose** (recomendado)

### Configuración Inicial

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd pos
   ```

2. **Configuración del Backend**
   ```bash
   cd PROYECTPOS/backend/pos-backend

   # Para desarrollo con H2 (por defecto)
   # No se necesita configuración adicional

   # Para desarrollo con PostgreSQL
   createdb posdb
   cp .env.example .env
   # Editar .env con tus credenciales de PostgreSQL
   ```

3. **Configuración del Frontend**
   ```bash
   cd PROYECTPOS/frontend/pos-frontend
   npm install
   ```

4. **Ejecutar con Docker (Recomendado)**
   ```bash
   # Desde la raíz del proyecto
   docker-compose up -d

   # Acceder:
   # Frontend: http://localhost:80
   # Backend API: http://localhost:8080
   # API Docs: http://localhost:8080/swagger-ui.html
   ```

5. **Ejecutar sin Docker**
   ```bash
   # Backend
   cd PROYECTPOS/backend/pos-backend
   mvn spring-boot:run

   # Frontend (terminal separada)
   cd PROYECTPOS/frontend/pos-frontend
   npm run dev
   ```

## 🏗️ Arquitectura del Sistema

### Patrón Hexagonal
```
Frontend (React + TypeScript)
├── UI Layer (React Components)
├── Application Layer (Zustand Store + Hooks)
├── Domain Layer (Business Logic + Types)
└── Infrastructure Layer (HTTP Adapters)

Backend (Java + Spring Boot)
├── Controller Layer (REST API)
├── Application Layer (Use Cases)
├── Domain Layer (Entities + Services)
└── Infrastructure Layer (JPA Repositories + External Services)
```

### Principios de Diseño
- **Separación de responsabilidades**: Cada capa tiene una única responsabilidad
- **Inversión de dependencias**: El dominio no depende de frameworks externos
- **Inyección de dependencias**: Spring maneja la configuración de dependencias
- **Clean Code**: Código legible, mantenible y bien documentado

## 🧪 Testing

### Estrategia de Testing
- **Unit Tests**: Lógica de dominio pura (90% cobertura objetivo)
- **Integration Tests**: Controladores y adaptadores externos
- **E2E Tests**: Flujos completos de usuario (planeado)

### Ejecutar Tests

```bash
# Backend - Todos los tests
cd PROYECTPOS/backend/pos-backend
mvn test

# Backend - Solo tests unitarios
mvn test -Dtest="*Test"

# Backend - Solo tests de integración
mvn test -Dtest="*IntegrationTest"

# Backend - Con reporte de cobertura
mvn clean verify

# Frontend - Tests unitarios
cd PROYECTPOS/frontend/pos-frontend
npm run test

# Frontend - Tests con cobertura
npm run test:coverage

# Frontend - Tests en modo watch
npm run test:watch
```

### Escribir Tests

#### Backend - Test Unitario de Servicio
```java
@ExtendWith(MockitoExtension.class)
class VentaServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private VentaService ventaService;

    @Test
    void confirmarVenta_conStockSuficiente_retornaVenta() {
        // Given
        var producto = new Producto("Producto A", 100.0, 10);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));

        // When
        var result = ventaService.confirmarVenta(List.of(new ItemVenta(1L, 2)));

        // Then
        assertThat(result.getTotal()).isEqualTo(200.0);
        verify(productoRepository).save(producto);
    }
}
```

#### Frontend - Test de Componente
```typescript
import { render, screen } from '@testing-library/react';
import { Cart } from './Cart';

describe('Cart', () => {
  it('shows empty cart message when no items', () => {
    render(<Cart />);
    expect(screen.getByText('Carrito vacío')).toBeInTheDocument();
  });

  it('displays cart items correctly', () => {
    const mockItems = [
      { id: 1, nombre: 'Producto A', cantidad: 2, precio: 50 }
    ];

    render(<Cart items={mockItems} />);
    expect(screen.getByText('Producto A')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });
});
```

## 🔧 Desarrollo Diario

### Flujo de Trabajo
1. **Crear rama** para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. **Desarrollar** siguiendo la arquitectura hexagonal
3. **Escribir tests** para la nueva funcionalidad
4. **Ejecutar tests** localmente: `mvn test && npm run test`
5. **Hacer commit** con mensaje descriptivo
6. **Push** y crear Pull Request

### Agregar una Nueva Funcionalidad

#### 1. Identificar la Capa
- **Dominio**: Reglas de negocio, entidades, servicios puros
- **Aplicación**: Casos de uso, coordinación entre servicios
- **Infraestructura**: Adaptadores externos (BD, APIs, etc.)
- **UI**: Componentes de interfaz, manejo de estado

#### 2. Backend - Nuevo Endpoint
```java
// Domain Layer
public record NuevoProducto(String nombre, double precio, int stock) {}

// Application Layer
@Service
public class ProductoService {
    public Producto crearProducto(NuevoProducto request) {
        // Lógica de negocio
        return productoRepository.save(new Producto(request.nombre(), request.precio(), request.stock()));
    }
}

// Infrastructure Layer
@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {
    @PostMapping
    public ResponseEntity<ApiResponse<ProductoDTO>> crearProducto(@RequestBody @Valid NuevoProducto request) {
        var producto = productoService.crearProducto(request);
        return ResponseEntity.ok(ApiResponse.of(ProductoDTO.from(producto)));
    }
}
```

#### 3. Frontend - Nuevo Componente
```typescript
// Domain Layer
export interface NuevoProducto {
  nombre: string;
  precio: number;
  stock: number;
}

// Application Layer
export const useCrearProducto = () => {
  return useMutation({
    mutationFn: (producto: NuevoProducto) => productoAdapter.crear(producto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    }
  });
};

// UI Layer
export const NuevoProductoForm = () => {
  const crearProducto = useCrearProducto();

  const handleSubmit = (data: NuevoProducto) => {
    crearProducto.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Convenciones de Código

#### Backend
- **Paquetes**: `com.pos.{domain|application|infrastructure}`
- **Nombres**: PascalCase para clases, camelCase para métodos/variables
- **Documentación**: JavaDoc en clases públicas y métodos complejos
- **Tests**: Un test class por cada clase de producción

#### Frontend
- **Archivos**: PascalCase para componentes, camelCase para hooks/utils
- **Imports**: Agrupar por tipo (React, third-party, local)
- **Tipos**: Definir interfaces para props y state
- **Tests**: Un test file por componente/hook

### Debugging

#### Backend
- **Logs**: Usar SLF4J con niveles apropiados
- **Breakpoints**: En IntelliJ IDEA o VS Code
- **H2 Console**: `http://localhost:8080/h2-console` (desarrollo)
- **Actuator**: `http://localhost:8080/actuator/health`

#### Frontend
- **React DevTools**: Para inspeccionar componentes y estado
- **Network Tab**: Para ver requests HTTP
- **Console**: Para logs y errores de JavaScript
- **Breakpoints**: En DevTools o VS Code

## 🚀 Despliegue

### Desarrollo
```bash
docker-compose up -d
```

### Producción
```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con valores de producción

# Build y deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Entorno Requeridas
- `DB_URL`: URL de conexión a PostgreSQL
- `DB_USER`: Usuario de base de datos
- `DB_PASSWORD`: Contraseña de base de datos
- `JWT_SECRET`: Clave secreta para JWT (256+ bits)
- `CORS_ALLOWED_ORIGINS`: Orígenes permitidos para CORS

## 📚 Recursos Adicionales

- [Documentación de Arquitectura Hexagonal](docs/ARCHITECTURE.md)
- [Guía de API](docs/API_REFERENCE.md)
- [Guía de Testing](docs/TESTING.md)
- [Guía de Despliegue](docs/DEPLOYMENT.md)
- [Solución de Problemas](docs/TROUBLESHOOTING.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Guías de Contribución
- Mantener cobertura de tests > 80%
- Seguir convenciones de código
- Documentar cambios significativos
- Usar conventional commits

---

*Última actualización: $(date)*