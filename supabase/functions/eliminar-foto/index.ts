import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";
import { eliminarArchivoDrive } from "../_shared/google-drive.ts";

// POST { foto_id: string, tipo: "modulo" | "submodulo" }
// Borra el archivo de Google Drive y luego el registro de la BD.
Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    await requireAdmin(req, adminClient);

    const { foto_id, tipo } = await req.json();

    if (!foto_id || typeof foto_id !== "string") {
      return new Response(JSON.stringify({ error: "foto_id es obligatorio" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (tipo !== "modulo" && tipo !== "submodulo") {
      return new Response(JSON.stringify({ error: 'tipo debe ser "modulo" o "submodulo"' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const tabla = tipo === "modulo" ? "modulo_fotos" : "submodulo_fotos";

    // 1. Obtener el drive_file_id antes de borrar
    const { data: foto, error: errorFoto } = await adminClient
      .from(tabla)
      .select("drive_file_id")
      .eq("id", foto_id)
      .single();

    if (errorFoto || !foto) {
      return new Response(JSON.stringify({ error: "Foto no encontrada" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // 2. Borrar de Drive (silencioso si ya no existe)
    try {
      await eliminarArchivoDrive(foto.drive_file_id);
    } catch {
      // No bloqueamos si Drive falla — igual borramos de la BD
    }

    // 3. Borrar de la BD
    const { error: errorBD } = await adminClient.from(tabla).delete().eq("id", foto_id);

    if (errorBD) {
      return new Response(JSON.stringify({ error: errorBD.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
