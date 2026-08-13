-- Sub-módulos: carpetas anidadas dentro de cada módulo (estilo Google Drive)
-- Ejecutar en Supabase SQL Editor

SET search_path = public;

CREATE TABLE IF NOT EXISTS submodulos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id       UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  drive_folder_id TEXT NOT NULL,
  creado_por      UUID REFERENCES auth.users(id),
  creado_en       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE submodulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access submodulos"
  ON submodulos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS submodulo_fotos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submodulo_id   UUID NOT NULL REFERENCES public.submodulos(id) ON DELETE CASCADE,
  drive_file_id  TEXT NOT NULL,
  url_publica    TEXT,
  descripcion    TEXT,
  orden          INT DEFAULT 0,
  creado_en      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE submodulo_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access submodulo_fotos"
  ON submodulo_fotos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
