import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";
import { subirArchivoADrive, urlMiniaturaDrive, eliminarArchivoDrive } from "../_shared/google-drive.ts";

// POST multipart { item_id, portada, tipo: "pelicula" | "serie" | "juego" }
// Usa la carpeta Drive correspondiente al tipo.
Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    await requireAdmin(req, adminClient);

    const form = await req.formData();
    const itemId = form.get("item_id");
    const archivo = form.get("portada");
    const tipo = form.get("tipo");

    if (!itemId || typeof itemId !== "string") {
      return new Response(JSON.stringify({ error: "item_id es obligatorio" }), { status: 400, headers: corsHeaders });
    }
    if (!archivo || !(archivo instanceof File)) {
      return new Response(JSON.stringify({ error: "portada es obligatoria" }), { status: 400, headers: corsHeaders });
    }

    // Elegir carpeta según tipo
    const folderMap: Record<string, string | undefined> = {
      pelicula: Deno.env.get("DRIVE_PELICULAS_FOLDER_ID"),
      serie:    Deno.env.get("DRIVE_SERIES_FOLDER_ID"),
      juego:    Deno.env.get("DRIVE_JUEGOS_FOLDER_ID"),
    };

    const tipoStr = typeof tipo === "string" ? tipo : "";
    const folderId = folderMap[tipoStr]
      ?? Deno.env.get("DRIVE_ENTRETENIMIENTO_FOLDER_ID")
      ?? Deno.env.get("DRIVE_ROOT_FOLDER_ID")!;

    // Borrar portada anterior si existe
    const { data: item } = await adminClient
      .from("entretenimiento")
      .select("drive_file_id")
      .eq("id", itemId)
      .single();

    if (item?.drive_file_id) {
      try { await eliminarArchivoDrive(item.drive_file_id); } catch { /* silencioso */ }
    }

    // Subir nueva portada
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const driveFileId = await subirArchivoADrive(folderId, archivo.name, bytes, archivo.type || "image/jpeg");

    const { error } = await adminClient
      .from("entretenimiento")
      .update({ url_portada: urlMiniaturaDrive(driveFileId), drive_file_id: driveFileId })
      .eq("id", itemId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ url_portada: urlMiniaturaDrive(driveFileId) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
