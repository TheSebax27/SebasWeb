import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";
import { subirArchivoADrive, urlMiniaturaDrive, eliminarArchivoDrive } from "../_shared/google-drive.ts";

// POST multipart { item_id, tabla: "conciertos" | "partidos", foto }
Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    await requireAdmin(req, adminClient);

    const form = await req.formData();
    const itemId = form.get("item_id");
    const tabla  = form.get("tabla");
    const archivo = form.get("foto");

    if (!itemId || typeof itemId !== "string") {
      return new Response(JSON.stringify({ error: "item_id es obligatorio" }), { status: 400, headers: corsHeaders });
    }
    if (tabla !== "conciertos" && tabla !== "partidos") {
      return new Response(JSON.stringify({ error: "tabla inválida" }), { status: 400, headers: corsHeaders });
    }
    if (!archivo || !(archivo instanceof File)) {
      return new Response(JSON.stringify({ error: "foto es obligatoria" }), { status: 400, headers: corsHeaders });
    }

    const folderId = Deno.env.get("DRIVE_EVENTOS_FOLDER_ID")
      ?? Deno.env.get("DRIVE_ROOT_FOLDER_ID")!;

    // Borrar foto anterior si existe
    const { data: item } = await adminClient
      .from(tabla)
      .select("drive_file_id")
      .eq("id", itemId)
      .single();

    if (item?.drive_file_id) {
      try { await eliminarArchivoDrive(item.drive_file_id); } catch { /* silencioso */ }
    }

    // Subir nueva foto
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const driveFileId = await subirArchivoADrive(folderId, archivo.name, bytes, archivo.type || "image/jpeg");

    const { error } = await adminClient
      .from(tabla)
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
