-- Agregar columna de unidad de peso a ejercicios_rutina
-- Ejecutar en Supabase SQL Editor

ALTER TABLE ejercicios_rutina
  ADD COLUMN IF NOT EXISTS unidad TEXT NOT NULL DEFAULT 'kg'
  CHECK (unidad IN ('kg', 'lbs'));
