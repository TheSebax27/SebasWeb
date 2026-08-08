import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";
import { crearCarpetaModulo } from "../_shared/google-drive.ts";

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    const admin = await requireAdmin(req, adminClient);

    const { nombre, descripcion } = await req.json();

    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return new Response(JSON.stringify({ error: "nombre es obligatorio" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Crear la carpeta en Drive primero
    const driveFolderId = await crearCarpetaModulo(nombre.trim());

    // 2. Insertar el módulo en la BD
    const { data: modulo, error } = await adminClient
      .from("modulos")
      .insert({
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

    return new Response(JSON.stringify(modulo), {
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
