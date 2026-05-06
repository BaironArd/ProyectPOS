-- ============================================================
-- Datos iniciales — POS Backend
-- ============================================================

-- Productos de ejemplo
INSERT INTO productos (nombre, precio, stock, categoria, activo, version) VALUES
('Mouse Óptico USB', 30000, 15, 'Periféricos', true, 0),
('Teclado Mecánico', 55000, 8, 'Periféricos', true, 0),
('Monitor 24"', 450000, 3, 'Monitores', true, 0),
('Audífonos Bluetooth', 85000, 12, 'Audio', true, 0),
('Cable HDMI 2m', 15000, 25, 'Cables', true, 0),
('Hub USB 4 puertos', 22000, 0, 'Periféricos', true, 0),
('Webcam HD 1080p', 120000, 5, 'Periféricos', true, 0),
('Mousepad XL', 18000, 20, 'Accesorios', true, 0),
('Disco SSD 500GB', 180000, 7, 'Almacenamiento', true, 0),
('Memoria RAM 8GB', 95000, 10, 'Componentes', true, 0),
('Laptop Stand', 45000, 6, 'Accesorios', true, 0),
('Cargador USB-C 65W', 38000, 14, 'Cargadores', true, 0);

-- Usuarios de prueba (passwords hasheados con BCrypt)
-- cajero01 / 1234
-- admin01  / admin123
INSERT INTO usuarios (usuario, password_hash, rol, activo) VALUES
('cajero01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CAJERO', true),
('cajero02', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CAJERO', true),
('admin01',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', true);
