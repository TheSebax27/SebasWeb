import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";
import { crearSubcarpeta } from "../_shared/google-drive.ts";

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    const admin = await requireAdmin(req, adminClient);

    const { nombre, descripcion, modulo_id } = await req.json();

    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return new Response(JSON.stringify({ error: "nombre es obligatorio" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!modulo_id || typeof modulo_id !== "string") {
      return new Response(JSON.stringify({ error: "modulo_id es obligatorio" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Obtener el drive_folder_id del módulo padre
    const { data: modulo, error: errorModulo } = await adminClient
      .from("modulos")
      .select("drive_folder_id")
      .eq("id", modulo_id)
      .single();

    if (errorModulo || !modulo) {
      return new Response(JSON.stringify({ error: "Módulo no encontrado" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // 2. Crear subcarpeta en Drive dentro de la carpeta del módulo
    const driveFolderId = await crearSubcarpeta(modulo.drive_folder_id, nombre.trim());

    // 3. Insertar el submódulo en la BD
    const { data: submodulo, error } = await adminClient
      .from("submodulos")
      .insert({
        modulo_id,
        nombre: nombre.trim(),
        descripcion: descripcion ?? null,
        drive_folder_id: driveFolderId,
        creado_por: admin.id,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(submodulo), {
      status: 201,
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
