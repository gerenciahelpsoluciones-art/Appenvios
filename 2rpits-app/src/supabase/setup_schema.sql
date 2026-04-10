-- 2Rpits Database Schema (Isolated trp_ prefix)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MOTOS (Vehicles)
CREATE TABLE trp_motos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placa VARCHAR(10) UNIQUE NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio INTEGER,
    serial_chasis VARCHAR(50),
    kilometraje INTEGER DEFAULT 0,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTOS (Inventory)
CREATE TABLE trp_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    precio_compra DECIMAL(12,2) DEFAULT 0,
    precio_venta DECIMAL(12,2) DEFAULT 0,
    moneda VARCHAR(3) DEFAULT 'COP',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SERVICIOS (Labors)
CREATE TABLE trp_servicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(12,2) NOT NULL,
    duracion_estimada INTERVAL, -- e.g., '1 hour'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMBOS (Bundles)
CREATE TABLE trp_combos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_combo DECIMAL(12,2) NOT NULL,
    vence_en TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMBO ITEMS (What's in the combo)
CREATE TABLE trp_combo_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    combo_id UUID REFERENCES trp_combos(id) ON DELETE CASCADE,
    item_type VARCHAR(20) CHECK (item_type IN ('PRODUCTO', 'SERVICIO')),
    item_id UUID NOT NULL, -- Logical reference
    cantidad INTEGER DEFAULT 1
);

-- ORDENES DE TRABAJO
CREATE TABLE trp_ordenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consecutivo SERIAL,
    moto_id UUID REFERENCES trp_motos(id),
    estado VARCHAR(20) DEFAULT 'RECEPCION', -- RECEPCION, PITS, CALIDAD, LISTO, ENTREGADO
    tecnico_nombre VARCHAR(100),
    observaciones_cliente TEXT,
    diagnostico_tecnico TEXT,
    subtotal DECIMAL(12,2) DEFAULT 0,
    impuestos DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    fecha_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_salida TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDEN ITEMS (Lines in the order)
CREATE TABLE trp_orden_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID REFERENCES trp_ordenes(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL, -- PRODUCTO, SERVICIO, COMBO
    ref_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cantidad INTEGER DEFAULT 1,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);
