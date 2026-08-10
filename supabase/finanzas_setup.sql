-- ============================================================
-- FINANZAS: Categorías personalizadas + Transacciones
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Categorías (las creas tú)
create table if not exists categorias_finanzas (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  tipo      text not null check (tipo in ('ingreso', 'gasto', 'ambos')),
  emoji     text,
  creado_en timestamptz default now()
);
alter table categorias_finanzas enable row level security;
create policy "auth_todo_categorias_finanzas" on categorias_finanzas
  for all to authenticated using (true) with check (true);

-- Algunas categorías iniciales de ejemplo (puedes borrarlas o editarlas)
insert into categorias_finanzas (nombre, tipo, emoji) values
  ('Salario',          'ingreso', '💰'),
  ('Freelance',        'ingreso', '💻'),
  ('Comida',           'gasto',   '🍔'),
  ('Transporte',       'gasto',   '🚗'),
  ('Entretenimiento',  'gasto',   '🎬'),
  ('Ropa',             'gasto',   '👕'),
  ('Salud',            'gasto',   '💊'),
  ('Suscripciones',    'gasto',   '📱'),
  ('Otros',            'ambos',   '📦');

-- Recrear transacciones con categoria_id
drop table if exists transacciones;
create table transacciones (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null check (tipo in ('ingreso', 'gasto')),
  categoria_id uuid references categorias_finanzas(id) on delete set null,
  monto        numeric(12,2) not null check (monto > 0),
  descripcion  text,
  fecha        date not null default current_date,
  creado_en    timestamptz default now()
);
alter table transacciones enable row level security;
create policy "auth_todo_transacciones" on transacciones
  for all to authenticated using (true) with check (true);
