-- =====================================================
-- Migración: Agregar columna fecha_facturado a despachos
-- Propósito: Registrar la fecha real de facturación para
-- calcular correctamente los totales de ventas por período.
-- Las cotizaciones ganadas en un mes y facturadas en el
-- siguiente ahora se contabilizan en el mes correcto.
-- =====================================================

ALTER TABLE despachos
ADD COLUMN IF NOT EXISTS fecha_facturado DATE;

-- Comentario descriptivo
COMMENT ON COLUMN despachos.fecha_facturado IS
  'Fecha en que se marcó el despacho como Facturado en el módulo de Facturación. 
   Se usa en Informes para calcular Total Rango y Utilidad Rango por fecha de facturación, 
   no por fecha de la cotización.';

-- Índice para mejorar las consultas por rango de fechas en Informes
CREATE INDEX IF NOT EXISTS idx_despachos_fecha_facturado
  ON despachos (fecha_facturado)
  WHERE facturado = true;
