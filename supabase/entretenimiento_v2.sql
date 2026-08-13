-- Entretenimiento v2: portada en Drive, plataforma, fecha_finalizado
-- Ejecutar en Supabase SQL Editor

ALTER TABLE entretenimiento
  ADD COLUMN IF NOT EXISTS url_portada     TEXT,
  ADD COLUMN IF NOT EXISTS drive_file_id   TEXT,
  ADD COLUMN IF NOT EXISTS plataforma      TEXT,
  ADD COLUMN IF NOT EXISTS fecha_finalizado DATE;
