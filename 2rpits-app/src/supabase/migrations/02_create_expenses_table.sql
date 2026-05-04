-- Expenses Table for 2Rpits
CREATE TABLE IF NOT EXISTS trp_gastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descripcion TEXT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- Fijo, Variable, Insumos, Nomina, Arriendo, Servicios
    fecha DATE DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(50), -- Efectivo, Transferencia, Tarjeta
    comprobante_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster reports
CREATE INDEX IF NOT EXISTS idx_trp_gastos_fecha ON trp_gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_trp_gastos_categoria ON trp_gastos(categoria);
