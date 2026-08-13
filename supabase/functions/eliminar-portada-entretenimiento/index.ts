import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";
import { eliminarArchivoDrive } from "../_shared/google-drive.ts";

// POST { item_id: string }
// Borra la portada de Drive. El registro de BD lo borra el cliente directamente.
Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    await requireAdmin(req, adminClient);

    const { item_id } = await req.json();
    if (!item_id || typeof item_id !== "string") {
      return new Response(JSON.stringify({ error: "item_id es obligatorio" }), { status: 400, headers: corsHeaders });
    }

    const { data: item } = await adminClient
      .from("entretenimiento")
      .select("drive_file_id")
      .eq("id", item_id)
      .single();

    if (item?.drive_file_id) {
      try { await eliminarArchivoDrive(item.drive_file_id); } catch { /* silencioso */ }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
