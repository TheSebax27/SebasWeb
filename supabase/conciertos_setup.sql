-- Tabla de conciertos
CREATE TABLE IF NOT EXISTS conciertos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artista       TEXT NOT NULL,
  tour_festival TEXT,
  lugar         TEXT,
  ciudad        TEXT,
  fecha         DATE,
  estado        TEXT NOT NULL DEFAULT 'quiero_ir' CHECK (estado IN ('fui', 'quiero_ir')),
  notas         TEXT,
  url_portada   TEXT,
  drive_file_id TEXT,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE conciertos ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer; la app controla quién escribe
CREATE POLICY "authenticated_read_conciertos" ON conciertos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_write_conciertos" ON conciertos
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
