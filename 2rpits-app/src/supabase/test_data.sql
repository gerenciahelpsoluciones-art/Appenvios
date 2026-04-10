-- Test Data for 2Rpits (Isolated trp_ prefix)

-- 1. MOTOS
INSERT INTO trp_motos (placa, marca, modelo, anio, kilometraje, cliente_nombre, cliente_telefono)
VALUES 
('ABC-123', 'Yamaha', 'MT-09', 2023, 12000, 'Carlos García', '3001234567'),
('XYZ-789', 'KTM', 'Duke 390', 2024, 500, 'Andrés Felipe', '3109876543'),
('MNO-456', 'Honda', 'CB650R', 2022, 15000, 'Marta Lucía', '3204561234'),
('JKL-012', 'Kawasaki', 'Z900', 2024, 100, 'Juan Pablo', '3157894561'),
('PFD-555', 'Suzuki', 'V-Strom 650', 2021, 25000, 'Roberto Gómez', '3112233445')
ON CONFLICT (placa) DO NOTHING;

-- 2. PRODUCTOS
INSERT INTO trp_productos (sku, nombre, descripcion, categoria, stock, stock_minimo, precio_compra, precio_venta)
VALUES 
('LUB-001', 'Aceite Motul 7100 10W40', 'Sintético de alto rendimiento', 'Lubricantes', 20, 5, 45000, 65000),
('FLT-001', 'Filtro Aceite Yamaha Original', 'Para serie MT y R', 'Repuestos', 15, 5, 15000, 35000),
('BRK-001', 'Pastilla Freno Brembo Delantera', 'Sinterizada', 'Frenos', 4, 6, 120000, 185000),
('LUB-002', 'Liqui Moly Chain Clean', 'Limpiador de cadena profesional', 'Limpieza', 12, 4, 25000, 48000),
('TRS-001', 'Kit Arrastre DID Racing', 'Remachado', 'Transmisión', 3, 2, 320000, 480000)
ON CONFLICT (sku) DO NOTHING;

-- 3. SERVICIOS
INSERT INTO trp_servicios (nombre, descripcion, precio)
VALUES 
('Sincronización Inyección', 'Limpieza de inyectores y cuerpo aceleración', 180000),
('Mantenimiento Preventivo', 'Revisión general de 20 puntos', 120000),
('Instalación Kit Arrastre', 'Mano de obra especializada', 65000),
('Lavado Técnico Premium', 'Limpieza detallada con desengrasado', 45000);

-- 4. COMBOS
INSERT INTO trp_combos (nombre, descripcion, precio_combo)
VALUES 
('Combo Tuning Pro', 'Aceite + Filtro + Lavado + Ajuste Cadena', 135000),
('Mantenimiento Seguro', 'Manto Preventivo + Pastillas Delanteras', 290000);

-- 5. ORDENES ACTIVAS
INSERT INTO trp_ordenes (moto_id, estado, tecnico_nombre, observaciones_cliente, total)
SELECT id, 'PITS', 'Juan Pérez', 'Ruido en el motor al encender', 350000 FROM trp_motos WHERE placa = 'ABC-123' LIMIT 1;

INSERT INTO trp_ordenes (moto_id, estado, tecnico_nombre, observaciones_cliente, total)
SELECT id, 'RECEPCION', 'Lucas M.', 'Revisión de frenos, se sienten largos', 120000 FROM trp_motos WHERE placa = 'XYZ-789' LIMIT 1;
