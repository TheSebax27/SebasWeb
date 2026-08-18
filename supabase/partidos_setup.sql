-- Tabla de partidos
CREATE TABLE IF NOT EXISTS partidos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion      TEXT NOT NULL,
  equipo_local     TEXT,
  equipo_visitante TEXT,
  competicion      TEXT,
  estadio          TEXT,
  ciudad           TEXT,
  fecha            DATE,
  resultado        TEXT,
  estado           TEXT NOT NULL DEFAULT 'quiero_ir' CHECK (estado IN ('fui', 'quiero_ir')),
  notas            TEXT,
  url_portada      TEXT,
  drive_file_id    TEXT,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_partidos" ON partidos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_write_partidos" ON partidos
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
