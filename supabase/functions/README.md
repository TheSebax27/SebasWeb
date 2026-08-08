# Edge Functions — App de Módulos

## Funciones
- **crear-usuario**: admin registra un nuevo usuario (email + password + rol).
- **crear-modulo**: admin crea un módulo → carpeta en Drive + fila en BD.
- **subir-foto**: admin sube una foto a la carpeta de Drive del módulo.

## Variables de entorno necesarias (Supabase → Project Settings → Edge Functions → Secrets)

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | Se inyecta automáticamente por Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Se inyecta automáticamente por Supabase |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Contenido completo del JSON de la cuenta de servicio de Google (como string) |
| `DRIVE_ROOT_FOLDER_ID` | ID de la carpeta raíz de Drive donde se crearán los módulos |

## Cómo obtener las credenciales de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) → crea o selecciona un proyecto.
2. Habilita la **Google Drive API** (APIs & Services → Library).
3. Ve a **IAM & Admin → Service Accounts** → crea una cuenta de servicio.
4. En la cuenta creada → **Keys → Add Key → JSON** → descarga el archivo.
5. Crea una carpeta en tu Google Drive personal (la raíz de módulos) y **compártela** (botón compartir) con el `client_email` de la cuenta de servicio, dándole permiso de **Editor**.
6. Copia el ID de esa carpeta desde la URL de Drive (`https://drive.google.com/drive/folders/<ESTE_ES_EL_ID>`).

## Despliegue

```bash
supabase functions deploy crear-usuario
supabase functions deploy crear-modulo
supabase functions deploy subir-foto

supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
supabase secrets set DRIVE_ROOT_FOLDER_ID="tu_id_de_carpeta"
```

## Llamado desde el frontend (React)

Todas requieren el JWT del usuario admin logueado (Supabase se lo agrega solo si usas `supabase.functions.invoke`):

```ts
const { data, error } = await supabase.functions.invoke('crear-modulo', {
  body: { nombre: 'Chaqueta Sebastian', descripcion: 'Colección invierno' }
});
```

Para `subir-foto`, como espera `multipart/form-data`, se debe usar `fetch` directo en vez de `invoke` (que serializa a JSON):

```ts
const formData = new FormData();
formData.append('modulo_id', moduloId);
formData.append('foto', archivo); // File del <input type="file">

const { data: { session } } = await supabase.auth.getSession();

await fetch(`${SUPABASE_URL}/functions/v1/subir-foto`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${session.access_token}` },
  body: formData,
});
```
