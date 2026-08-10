-- ============================================================
-- GYM: Rediseño con nivel de días
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Tabla de días (nivel intermedio entre rutina y ejercicios)
create table if not exists dias_rutina (
  id        uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references rutinas(id) on delete cascade,
  nombre    text not null,
  orden     int  not null default 0
);
alter table dias_rutina enable row level security;
create policy "auth_todo_dias_rutina" on dias_rutina
  for all to authenticated using (true) with check (true);

-- Recrear ejercicios_rutina apuntando a dia_id en vez de rutina_id
drop table if exists ejercicios_rutina;
create table ejercicios_rutina (
  id       uuid primary key default gen_random_uuid(),
  dia_id   uuid not null references dias_rutina(id) on delete cascade,
  nombre   text not null,
  series   int  not null default 3,
  reps     text not null default '10',
  peso_kg  numeric(5,1),
  notas    text,
  orden    int  not null default 0
);
alter table ejercicios_rutina enable row level security;
create policy "auth_todo_ejercicios_rutina" on ejercicios_rutina
  for all to authenticated using (true) with check (true);
