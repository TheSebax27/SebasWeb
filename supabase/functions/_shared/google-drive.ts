let tokenCacheado: { token: string; expira: number } | null = null;

async function obtenerAccessToken(): Promise<string> {
  const ahora = Math.floor(Date.now() / 1000);

  if (tokenCacheado && tokenCacheado.expira > ahora + 60) {
    return tokenCacheado.token;
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan variables de entorno: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REFRESH_TOKEN",
    );
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    throw new Error(`Error obteniendo token de Google: ${await resp.text()}`);
  }

  const data = await resp.json();
  tokenCacheado = { token: data.access_token, expira: ahora + data.expires_in };
  return data.access_token;
}

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

export async function crearSubcarpeta(parentFolderId: string, nombre: string): Promise<string> {
  const token = await obtenerAccessToken();

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
        parents: [parentFolderId],
      }),
    },
  );

  if (!resp.ok) {
    throw new Error(`Error creando subcarpeta en Drive: ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.id as string;
}

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
