# Solución de Problemas - POS System

## 🔍 Problemas Comunes y Soluciones

### Backend No Inicia

#### Error: "Port 8080 already in use"
```bash
# Encontrar proceso usando el puerto
netstat -ano | findstr :8080

# Matar el proceso (reemplaza PID)
taskkill /PID <PID> /F

# O cambiar puerto en application.properties
server.port=8081
```

#### Error: "Could not create connection to database server"
```bash
# Verificar que PostgreSQL esté corriendo
pg_isready -h localhost -p 5432

# Verificar credenciales en application-prod.properties
# Asegurarse que la base de datos existe
createdb posdb
```

#### Error: "JWT secret too short"
```bash
# Generar clave segura de 256 bits
openssl rand -hex 32

# Actualizar en application-prod.properties
jwt.secret=tu_clave_generada_de_64_caracteres
```

### Frontend No Carga

#### Error: "Failed to fetch" / "Network Error"
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8080/api/v1/actuator/health

# Verificar CORS configuration
# En application.properties:
cors.allowed-origins=http://localhost:5173
```

#### Error: "Module not found"
```bash
# Limpiar node_modules y reinstallar
rm -rf node_modules package-lock.json
npm install
```

#### Error: "TypeScript errors"
```bash
# Verificar tipos
npm run build

# Si hay errores de tipos, revisar imports
# Asegurarse que las interfaces coincidan entre frontend/backend
```

### Base de Datos

#### Error: "Table doesn't exist"
```bash
# En desarrollo con H2, las tablas se crean automáticamente
# En producción, verificar que data.sql se ejecutó

# Ver contenido de H2 console: http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:mem:posdb
```

#### Error: "Duplicate key value"
```bash
# Los usuarios se crean via DataInitializer
# Si hay conflictos, limpiar la base de datos
# En H2: DROP ALL OBJECTS;
# En PostgreSQL: TRUNCATE usuarios RESTART IDENTITY;
```

### Autenticación

#### Error: "Usuario o contraseña incorrectos"
```bash
# Verificar credenciales de prueba
# cajero01 / 1234
# cajero02 / 1234
# admin01 / admin123

# Verificar que DataInitializer se ejecutó
# Logs deberían mostrar: "Creando usuarios de prueba"
```

#### Error: "Token expired" / "Invalid token"
```bash
# Tokens expiran en 8 horas (28800 segundos)
# Hacer login nuevamente

# Verificar JWT_SECRET en configuración
# Debe ser la misma clave usada para generar tokens
```

### Docker

#### Error: "Port already allocated"
```bash
# Ver qué contenedor usa el puerto
docker ps

# Detener contenedor específico
docker stop <container_id>

# O cambiar puertos en docker-compose.yml
```

#### Error: "No such file or directory" en Docker build
```bash
# Asegurarse que el JAR existe antes del build
cd PROYECTPOS/backend/pos-backend
mvn clean package -DskipTests

# Verificar que target/*.jar existe
ls -la target/
```

#### Error: "Health check failed"
```bash
# Ver logs del contenedor
docker logs <container_name>

# Verificar conectividad
docker exec <container_name> curl http://localhost:8080/actuator/health
```

### Tests

#### Error: "Tests failed"
```bash
# Backend - ejecutar tests específicos
mvn test -Dtest=AuthControllerIntegrationTest

# Ver reportes detallados
mvn surefire-report:report

# Frontend - ejecutar tests con más detalle
npm run test -- --reporter=verbose
```

#### Error: "Coverage below threshold"
```bash
# Ver reporte de cobertura
mvn jacoco:report

# Abrir en navegador: target/site/jacoco/index.html

# Para frontend
npm run test:coverage
# Abrir: coverage/index.html
```

### CI/CD

#### Error: "Build failed in GitHub Actions"
```bash
# Ver logs detallados en la pestaña "Actions"
# Común: falta de dependencias o errores de compilación

# Ejecutar localmente primero
mvn clean verify
npm run build
```

#### Error: "Docker build failed"
```bash
# Probar build localmente
docker build -t pos-backend ./PROYECTPOS/backend/pos-backend

# Verificar que archivos existen
ls -la PROYECTPOS/backend/pos-backend/target/
```

## 🛠️ Herramientas de Diagnóstico

### Backend
```bash
# Health check
curl http://localhost:8080/actuator/health

# Info del sistema
curl http://localhost:8080/actuator/info

# Métricas
curl http://localhost:8080/actuator/metrics

# Logs en tiempo real
tail -f logs/application.log
```

### Frontend
```bash
# Ver procesos de Node.js
ps aux | grep node

# Limpiar cache de Vite
rm -rf node_modules/.vite

# Ver logs del navegador
# Abrir DevTools > Console
```

### Base de Datos
```bash
# H2 Console (desarrollo)
# URL: http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:mem:posdb

# PostgreSQL (producción)
psql -h localhost -U pos_user -d posdb
# \dt para ver tablas
# SELECT * FROM usuarios;
```

### Docker
```bash
# Ver estado de contenedores
docker ps -a

# Ver logs
docker logs pos-backend
docker logs pos-frontend

# Ver redes
docker network ls

# Limpiar contenedores detenidos
docker system prune
```

## 🚨 Problemas Críticos

### Sistema No Responde
1. Verificar conectividad de red
2. Revisar logs del sistema
3. Verificar uso de recursos (CPU, memoria)
4. Reiniciar servicios en orden: DB → Backend → Frontend

### Datos Corruptos
1. **NO** intentar reparar manualmente
2. Hacer backup de logs
3. Restaurar desde backup limpio
4. Investigar causa raíz

### Seguridad Comprometida
1. Cambiar todas las claves secretas
2. Auditar logs de acceso
3. Revisar configuraciones de seguridad
4. Actualizar dependencias vulnerables

## 📞 Soporte

Si los pasos anteriores no resuelven el problema:

1. **Recopilar información**:
   - Logs completos
   - Configuración actual
   - Pasos para reproducir el error
   - Versión de Java, Node.js, Docker

2. **Crear issue** en el repositorio con:
   - Descripción detallada del problema
   - Pasos para reproducir
   - Logs y configuración
   - Entorno (OS, versiones)

3. **Contactar al equipo**:
   - Email: soporte@pos-system.com
   - Slack: #pos-support

---

*Última actualización: $(date)*