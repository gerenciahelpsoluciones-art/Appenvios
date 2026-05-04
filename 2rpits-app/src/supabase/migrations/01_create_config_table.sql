-- Configuration Table for 2Rpits
CREATE TABLE IF NOT EXISTS trp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default Settings
INSERT INTO trp_config (key, value) VALUES 
('workshop_info', '{
    "name": "2Rpits Pits",
    "nit": "900.123.456-7",
    "address": "Calle 123 # 45-67, Ciudad",
    "phone": "+57 300 123 4567",
    "email": "contacto@2rpits.com",
    "logo_url": "/logo.jpg"
}'),
('maintenance_rules', '{
    "days_threshold": 120,
    "km_threshold": 3000
}'),
('client_tiers', '{
    "pro_threshold": 1000000,
    "expert_threshold": 500000
}'),
('billing_settings', '{
    "tax_percent": 19,
    "currency": "COP",
    "invoice_footer": "Gracias por confiar en los expertos. ¡Rueda seguro!"
}')
ON CONFLICT (key) DO NOTHING;
