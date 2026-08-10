# SebasWeb — CLAUDE.md

## Descripción general
App web de gestión de módulos con galería de fotos. Los módulos se crean con una carpeta en Google Drive; las fotos se suben a Drive via Edge Functions de Supabase y se muestran en la app.

## Stack
- **Frontend:** React 18 + TypeScript + Vite + React Router v6
- **Backend:** Supabase (Auth, Postgres, Edge Functions en Deno/TypeScript)
- **Almacenamiento:** Google Drive (fotos de módulos)
- **Sin CSS framework** — estilos inline directamente en JSX

## Estructura de carpetas
```
src/
  App.tsx                    # Router principal, rutas y layouts
  types.ts                   # Interfaces: Perfil, Modulo, ModuloFoto, Rol
  supabaseClient.ts          # Cliente Supabase singleton
  context/AuthContext.tsx    # Contexto de autenticación (perfil + sesión)
  components/
    Navbar.tsx               # Barra de navegación
    ProtectedRoute.tsx       # Guard de rutas por rol
  pages/
    Login.tsx                # Página de login
    Modulos.tsx              # Lista de módulos
    ModuloDetalle.tsx        # Detalle + galería de fotos + subida
    CrearModulo.tsx          # Formulario crear módulo (solo admin)
    Usuarios.tsx             # Gestión de usuarios (solo admin)

supabase/functions/
  _shared/
    auth.ts                  # crearClienteAdmin(), requireAdmin()
    cors.ts                  # corsHeaders + handleCors()
    google-drive.ts          # obtenerAccessToken(), crearCarpetaModulo(), subirArchivoADrive(), urlMiniaturaDrive()
  crear-modulo/index.ts      # POST: crea carpeta en Drive + registro en BD
  crear-usuario/index.ts     # POST: crea usuario en Auth + perfil en BD
  subir-foto/index.ts        # POST multipart: sube foto a Drive + registro en modulo_fotos
```

## Variables de entorno requeridas

### Frontend (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=              # Client ID de la app OAuth2 tipo "Web" en Google Cloud Console
GOOGLE_CLIENT_SECRET=          # Client Secret de esa app
GOOGLE_REFRESH_TOKEN=          # Refresh token generado via OAuth Playground (cuenta silvasebastian2703@gmail.com)
DRIVE_ROOT_FOLDER_ID=          # ID de carpeta raíz en Google Drive (Mi unidad, compartida con la app)
```

> **Nota:** Se migró de Service Account (JWT) a OAuth2 con refresh token porque las Service Accounts
> no tienen cuota de almacenamiento. Los archivos ahora se guardan en la cuenta personal de Google.
> El refresh token no expira salvo que se revoque manualmente desde myaccount.google.com/permissions.

## Base de datos (Supabase / Postgres)
| Tabla | Campos clave |
|-------|-------------|
| `perfiles` | `id` (=auth.uid), `email`, `nombre`, `rol` (admin/visualizador), `activo` |
| `modulos` | `id`, `nombre`, `descripcion`, `drive_folder_id`, `creado_por`, timestamps |
| `modulo_fotos` | `id`, `modulo_id`, `drive_file_id`, `url_publica`, `orden`, `creado_en` |

## Roles
- **admin:** puede crear módulos, subir fotos, gestionar usuarios
- **visualizador:** solo lectura

## Google Drive — integración

### Arquitectura
- La Edge Function obtiene un JWT de Service Account, lo intercambia por un access_token OAuth2 y llama a la Drive API v3.
- El token se cachea en memoria del proceso (~1 hora).
- Las fotos se hacen públicas con `role: reader, type: anyone` tras subirse.
- Las URLs de miniatura tienen formato: `https://drive.google.com/thumbnail?id={fileId}&sz=w800`

### IMPORTANTE: Shared Drive obligatorio
Las Service Accounts **no tienen cuota de almacenamiento propia**. La carpeta raíz (`DRIVE_ROOT_FOLDER_ID`) **debe estar dentro de una Shared Drive (Unidad Compartida)**, no en "Mi unidad".

**Setup requerido en Google Drive:**
1. Crear una Shared Drive (Google Drive → "Unidades compartidas" → Nueva)
2. Agregar el email de la Service Account como miembro con rol **Contribuidor**
3. Crear la carpeta raíz dentro de esa Shared Drive
4. Usar el ID de esa carpeta como `DRIVE_ROOT_FOLDER_ID`

Todas las llamadas a la Drive API ya incluyen `supportsAllDrives=true` para soportar Shared Drives.

## Flujo de creación de módulo
1. Admin llena formulario en `/modulos/nuevo`
2. POST a Edge Function `crear-modulo` (con JWT del usuario)
3. Edge Function crea carpeta en Drive (`crearCarpetaModulo`)
4. Inserta registro en tabla `modulos` con `drive_folder_id`
5. Redirige a `/modulos/{id}`

## Flujo de subida de foto
1. Admin selecciona archivo en `ModuloDetalle`
2. POST multipart a Edge Function `subir-foto`
3. Busca `drive_folder_id` del módulo en BD
4. Llama `subirArchivoADrive` (multipart a Drive API)
5. Hace el archivo público (permissions API)
6. Inserta registro en `modulo_fotos` con URL de miniatura

## Comandos
```bash
npm run dev      # Servidor de desarrollo Vite
npm run build    # Build de producción (tsc + vite build)
npx supabase functions serve   # Servir Edge Functions localmente
npx supabase functions deploy crear-modulo
npx supabase functions deploy crear-usuario
npx supabase functions deploy subir-foto
```
