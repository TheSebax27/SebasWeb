-- Créditos / deudas con cuotas
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS creditos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            TEXT NOT NULL,
  entidad           TEXT,
  tipo              TEXT NOT NULL DEFAULT 'credito'
                    CHECK (tipo IN ('credito', 'tarjeta', 'hipoteca', 'vehiculo', 'otro')),
  monto_total       NUMERIC(12,2) NOT NULL CHECK (monto_total > 0),
  cuotas_total      INT  NOT NULL CHECK (cuotas_total > 0),
  cuotas_pagadas    INT  NOT NULL DEFAULT 0 CHECK (cuotas_pagadas >= 0),
  monto_cuota       NUMERIC(10,2) NOT NULL CHECK (monto_cuota > 0),
  tasa_interes      NUMERIC(5,2),                  -- % anual, opcional
  fecha_inicio      DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_proximo_pago DATE,
  descripcion       TEXT,
  estado            TEXT NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'pagado')),
  creado_en         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_todo_creditos"
  ON creditos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
