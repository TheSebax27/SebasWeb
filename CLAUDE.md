# SebasWeb — CLAUDE.md

## Descripción general
App web personal de Sebastián. Incluye gestión de módulos con galería de fotos (Drive), finanzas personales, metas, rutinas de gym, notas y tracker de entretenimiento.

## Stack
- **Frontend:** React 18 + TypeScript + Vite + React Router v6
- **Backend:** Supabase (Auth, Postgres, Edge Functions en Deno/TypeScript)
- **Almacenamiento fotos:** Google Drive via OAuth2 refresh token
- **CSS:** Sistema de diseño propio en `src/index.css` con CSS custom properties — NO estilos inline ni framework externo
- **Tipografía:** Instrument Serif (títulos/display) + Inter (UI) via Google Fonts en `index.html`
- **Componentes compartidos:** `src/components/UI.tsx` — PageHeader, Btn, Field, Badge, Divider, EmptyState, StatTile
- **Deploy:** Vercel (frontend) + Supabase (backend/functions)

## Sistema de diseño
- **Paleta:** Crema cálida (#F7F6F3 bg), verde bosque profundo (#1A3A2E acento), negro cálido (#111110)
- **Elemento distintivo:** Numeración de secciones `01 / MÓDULOS`, `02 / FINANZAS`, etc. en cada PageHeader
- **Clases clave:** `.page`, `.page-wide`, `.card`, `.btn`, `.btn-primary/ghost/text/danger`, `.input`, `.field`, `.badge`, `.pill-tab`, `.stat-tile`, `.ph` (page header)
- **Dark mode:** Soportado via `@media (prefers-color-scheme: dark)` con CSS vars

## Estructura de carpetas
```
src/
  App.tsx                    # Router principal — todas las rutas
  types.ts                   # Todas las interfaces TypeScript
  supabaseClient.ts          # Cliente Supabase singleton
  context/AuthContext.tsx    # Contexto de autenticación (perfil + sesión)
  components/
    Navbar.tsx               # Barra de navegación con links activos resaltados
    ProtectedRoute.tsx       # Guard de rutas por rol
  pages/
    Login.tsx                # Página de login
    Modulos.tsx              # Lista de módulos (todos los roles)
    ModuloDetalle.tsx        # Detalle + galería con descripción por foto
    CrearModulo.tsx          # Formulario crear módulo (solo admin)
    Usuarios.tsx             # Gestión de usuarios (solo admin)
    Finanzas.tsx             # Ingresos/gastos con categorías personalizadas
    Metas.tsx                # Objetivos con barra de progreso y fecha límite
    Gym.tsx                  # Rutinas → días → ejercicios
    Notas.tsx                # Notas de colores con modal de edición
    Entretenimiento.tsx      # Películas, series y juegos (quiero/en progreso/visto)

supabase/functions/
  _shared/
    auth.ts                  # crearClienteAdmin(), requireAdmin()
    cors.ts                  # corsHeaders + handleCors()
    google-drive.ts          # obtenerAccessToken() via refresh token, crearCarpetaModulo(), subirArchivoADrive(), urlMiniaturaDrive()
  crear-modulo/index.ts      # POST: crea carpeta en Drive + registro en BD
  crear-usuario/index.ts     # POST: crea usuario en Auth + perfil en BD
  subir-foto/index.ts        # POST multipart: sube foto + descripcion a Drive + BD

supabase/
  nuevas_secciones.sql       # Tablas: transacciones, metas, rutinas, notas, entretenimiento
  gym_rediseno.sql           # Tablas gym con nivel días: dias_rutina + ejercicios_rutina
  finanzas_setup.sql         # Tabla categorias_finanzas + recrear transacciones con categoria_id
```

## Rutas
| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/login` | Login | Público |
| `/` | Modulos | Todos |
| `/modulos/nuevo` | CrearModulo | Admin |
| `/modulos/:id` | ModuloDetalle | Todos |
| `/finanzas` | Finanzas | Admin |
| `/metas` | Metas | Admin |
| `/gym` | Gym | Admin |
| `/notas` | Notas | Admin |
| `/entretenimiento` | Entretenimiento | Admin |
| `/usuarios` | Usuarios | Admin |

## Variables de entorno

### Frontend (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=        # App OAuth2 tipo "Web" en Google Cloud Console
GOOGLE_CLIENT_SECRET=    # Secret de esa app
GOOGLE_REFRESH_TOKEN=    # Generado via OAuth Playground con cuenta silvasebastian2703@gmail.com
DRIVE_ROOT_FOLDER_ID=    # ID de carpeta raíz en Google Drive (Mi unidad, compartida con la app OAuth)
```

> El refresh token no expira salvo revocación manual en myaccount.google.com/permissions.
> Se migró de Service Account a OAuth2 porque las SA no tienen cuota de almacenamiento.

## Base de datos (Supabase / Postgres)

### Módulos
| Tabla | Campos clave |
|-------|-------------|
| `perfiles` | `id` (=auth.uid), `email`, `nombre`, `rol` (admin/visualizador), `activo` |
| `modulos` | `id`, `nombre`, `descripcion`, `drive_folder_id`, `creado_por`, timestamps |
| `modulo_fotos` | `id`, `modulo_id`, `drive_file_id`, `url_publica`, `descripcion`, `orden`, `creado_en` |

### Finanzas
| Tabla | Campos clave |
|-------|-------------|
| `categorias_finanzas` | `id`, `nombre`, `tipo` (ingreso/gasto/ambos), `emoji` |
| `transacciones` | `id`, `tipo` (ingreso/gasto), `categoria_id` → categorias_finanzas, `monto`, `descripcion`, `fecha` |

### Metas
| Tabla | Campos clave |
|-------|-------------|
| `metas` | `id`, `titulo`, `descripcion`, `valor_meta`, `valor_actual`, `fecha_limite`, `completada` |

### Gym (3 niveles)
| Tabla | Campos clave |
|-------|-------------|
| `rutinas` | `id`, `nombre`, `descripcion` |
| `dias_rutina` | `id`, `rutina_id` → rutinas, `nombre`, `orden` |
| `ejercicios_rutina` | `id`, `dia_id` → dias_rutina, `nombre`, `series`, `reps` (texto, admite "8-12"), `peso_kg`, `notas`, `orden` |

### Notas
| Tabla | Campos clave |
|-------|-------------|
| `notas` | `id`, `titulo`, `contenido`, `color` (hex), `creado_en`, `actualizado_en` |

### Entretenimiento
| Tabla | Campos clave |
|-------|-------------|
| `entretenimiento` | `id`, `titulo`, `tipo` (pelicula/serie/juego), `estado` (visto/quiero/en_progreso), `rating` (1-5), `notas` |

Todas las tablas nuevas tienen RLS habilitado con política `authenticated` puede todo.

## Roles
- **admin:** acceso completo a todas las secciones
- **visualizador:** solo puede ver Módulos (lectura)

## Google Drive — integración

### Flujo OAuth2 con refresh token
1. `google-drive.ts` llama a `https://oauth2.googleapis.com/token` con `grant_type=refresh_token`
2. El access_token se cachea en memoria del proceso (~1 hora)
3. Todas las llamadas llevan `supportsAllDrives=true`
4. Las fotos se hacen públicas con `role: reader, type: anyone`
5. URL de miniatura: `https://drive.google.com/thumbnail?id={fileId}&sz=w800`

### Flujo de subida de foto
1. Admin escribe descripción opcional + selecciona imagen en `ModuloDetalle`
2. POST multipart a Edge Function `subir-foto` (campos: `modulo_id`, `foto`, `descripcion`)
3. Sube a la carpeta Drive del módulo → guarda `drive_file_id`, `url_publica`, `descripcion` en `modulo_fotos`

## Funcionalidades por sección

### Finanzas
- Categorías personalizadas (emoji + nombre + tipo ingreso/gasto/ambos)
- Resumen mensual: ingresos, gastos, balance
- Navegación mes a mes (‹ ›)
- Lista de transacciones agrupada por fecha
- Al agregar transacción: las categorías se filtran según si es ingreso o gasto

### Metas
- Metas con o sin valor numérico objetivo
- Barra de progreso con % y campo para sumar avance incremental
- Fecha límite con contador de días restantes (rojo si venció)
- Filtros: Activas / Completadas / Todas
- Resumen con conteos

### Gym
- Rutinas como acordeón (clic expande/cierra)
- Días como tabs dentro de cada rutina
- Ejercicios numerados con series × reps + peso kg + notas
- Reps acepta rangos de texto ("8-12", "al fallo", etc.)
- Edición inline de ejercicios

### Notas
- Grid de tarjetas de colores (8 colores disponibles)
- Modal de edición con paleta de colores circular
- Guardar también al hacer clic fuera del modal
- Ordenadas por `actualizado_en` desc

### Entretenimiento
- Filtro por tipo: Películas / Series / Juegos
- Filtro por estado: Lo quiero / En progreso / Visto-Jugado
- Rating con estrellas clicables (actualización inmediata)
- Cambio de estado directo desde la card

## Comandos
```bash
npm run dev      # Servidor de desarrollo Vite
npm run build    # Build de producción (tsc + vite build)

# Deploy de Edge Functions (reemplazar PROJECT_REF)
npx supabase functions deploy subir-foto    --project-ref PROJECT_REF
npx supabase functions deploy crear-modulo  --project-ref PROJECT_REF
npx supabase functions deploy crear-usuario --project-ref PROJECT_REF
```

## SQL pendiente de ejecutar en Supabase
Si es una instalación nueva, ejecutar en orden en el SQL Editor:
1. `supabase/nuevas_secciones.sql` — tablas base de todas las secciones
2. `supabase/gym_rediseno.sql` — rediseño gym con nivel días
3. `supabase/finanzas_setup.sql` — categorías + recrear transacciones
