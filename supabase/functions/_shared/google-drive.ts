import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5";

interface CredencialesServicio {
  client_email: string;
  private_key: string;
}

let tokenCacheado: { token: string; expira: number } | null = null;

/**
 * Obtiene (y cachea en memoria del proceso) un access_token OAuth2
 * para la cuenta de servicio de Google, con scope de Drive.
 */
async function obtenerAccessToken(): Promise<string> {
  const ahora = Math.floor(Date.now() / 1000);

  if (tokenCacheado && tokenCacheado.expira > ahora + 60) {
    return tokenCacheado.token;
  }

  const credencialesRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!credencialesRaw) {
    throw new Error("Falta variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON");
  }
  const credenciales: CredencialesServicio = JSON.parse(credencialesRaw);

  const privateKey = await importPKCS8(credenciales.private_key, "RS256");

  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/drive",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(credenciales.client_email)
    .setSubject(credenciales.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(ahora)
    .setExpirationTime(ahora + 3600)
    .sign(privateKey);

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Error obteniendo token de Google: ${await resp.text()}`);
  }

  const data = await resp.json();
  tokenCacheado = { token: data.access_token, expira: ahora + data.expires_in };
  return data.access_token;
}

/**
 * Crea una carpeta en Drive dentro de la carpeta raíz configurada
 * (DRIVE_ROOT_FOLDER_ID) y devuelve su ID.
 */
export async function crearCarpetaModulo(nombre: string): Promise<string> {
  const token = await obtenerAccessToken();
  const rootFolderId = Deno.env.get("DRIVE_ROOT_FOLDER_ID")!;

  const resp = await fetch(
    "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nombre,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
      }),
    },
  );

  if (!resp.ok) {
    throw new Error(`Error creando carpeta en Drive: ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.id as string;
}

/**
 * Sube un archivo (bytes) a una carpeta específica de Drive.
 * Devuelve el ID del archivo creado.
 */
export async function subirArchivoADrive(
  carpetaId: string,
  nombreArchivo: string,
  contenido: Uint8Array,
  mimeType: string,
): Promise<string> {
  const token = await obtenerAccessToken();

  const metadata = { name: nombreArchivo, parents: [carpetaId] };
  const boundary = "-------drive-upload-boundary";

  const bodyParts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  ];

  const encoder = new TextEncoder();
  const cierre = encoder.encode(`\r\n--${boundary}--`);

  const partesBinarias = [
    encoder.encode(bodyParts[0]),
    encoder.encode(bodyParts[1]),
    contenido,
    cierre,
  ];

  const bodyCompleto = new Uint8Array(
    partesBinarias.reduce((acc, p) => acc + p.length, 0),
  );
  let offset = 0;
  for (const parte of partesBinarias) {
    bodyCompleto.set(parte, offset);
    offset += parte.length;
  }

  const resp = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: bodyCompleto,
    },
  );

  if (!resp.ok) {
    throw new Error(`Error subiendo archivo a Drive: ${await resp.text()}`);
  }

  const data = await resp.json();

  // Hace el archivo visible con el link (lector), para poder mostrarlo en la app
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    },
  );

  return data.id as string;
}

export function urlMiniaturaDrive(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
}
