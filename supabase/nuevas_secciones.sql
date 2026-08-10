-- ============================================================
-- NUEVAS SECCIONES: Finanzas, Metas, Gym, Notas, Entretenimiento
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- FINANZAS
create table if not exists transacciones (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('ingreso', 'gasto')),
  categoria   text not null,
  monto       numeric(10,2) not null check (monto > 0),
  descripcion text,
  fecha       date not null default current_date,
  creado_en   timestamptz default now()
);
alter table transacciones enable row level security;
create policy "auth_todo_transacciones" on transacciones for all to authenticated using (true) with check (true);

-- METAS
create table if not exists metas (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  descripcion  text,
  valor_meta   numeric(10,2),
  valor_actual numeric(10,2) not null default 0,
  fecha_limite date,
  completada   boolean not null default false,
  creado_en    timestamptz default now()
);
alter table metas enable row level security;
create policy "auth_todo_metas" on metas for all to authenticated using (true) with check (true);

-- GYM
create table if not exists rutinas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  creado_en   timestamptz default now()
);
alter table rutinas enable row level security;
create policy "auth_todo_rutinas" on rutinas for all to authenticated using (true) with check (true);

create table if not exists ejercicios_rutina (
  id        uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references rutinas(id) on delete cascade,
  nombre    text not null,
  series    int not null default 3,
  reps      text not null default '10',
  peso_kg   numeric(5,1),
  orden     int not null default 0
);
alter table ejercicios_rutina enable row level security;
create policy "auth_todo_ejercicios" on ejercicios_rutina for all to authenticated using (true) with check (true);

-- NOTAS
create table if not exists notas (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  contenido     text,
  color         text not null default '#ffffff',
  creado_en     timestamptz default now(),
  actualizado_en timestamptz default now()
);
alter table notas enable row level security;
create policy "auth_todo_notas" on notas for all to authenticated using (true) with check (true);

-- ENTRETENIMIENTO
create table if not exists entretenimiento (
  id        uuid primary key default gen_random_uuid(),
  titulo    text not null,
  tipo      text not null check (tipo in ('pelicula', 'serie', 'juego')),
  estado    text not null check (estado in ('visto', 'quiero', 'en_progreso')),
  rating    int check (rating between 1 and 5),
  notas     text,
  creado_en timestamptz default now()
);
alter table entretenimiento enable row level security;
create policy "auth_todo_entretenimiento" on entretenimiento for all to authenticated using (true) with check (true);
