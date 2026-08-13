-- Permisos granulares por usuario (columna JSONB en perfiles)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS permisos JSONB;

-- Comentario sobre la estructura esperada:
-- {
--   "pestanas": {
--     "galeria":         true,
--     "finanzas":        false,
--     "metas":           false,
--     "gym":             false,
--     "notas":           false,
--     "entretenimiento": false
--   },
--   "modulos_todos": true,      -- true = todos los módulos visibles
--   "modulos_ids":   []         -- IDs específicos cuando modulos_todos = false
-- }
-- Los admins ignoran esta columna (acceso total siempre).
-- null = solo acceso a galería (comportamiento heredado para usuarios existentes).
