-- Préstamos: tracking de dinero prestado y recibido
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS prestamos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            TEXT NOT NULL CHECK (tipo IN ('prestado', 'recibido')),
  -- 'prestado' = yo le presté a alguien  → sale dinero (gasto)
  -- 'recibido' = me prestaron             → entra dinero (ingreso)
  persona         TEXT NOT NULL,
  monto           NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  descripcion     TEXT,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  estado          TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'parcial', 'saldado')),
  monto_devuelto  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (monto_devuelto >= 0),
  fecha_devolucion DATE,
  creado_en       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_todo_prestamos"
  ON prestamos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
