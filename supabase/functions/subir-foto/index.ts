import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";
import { subirArchivoADrive, urlMiniaturaDrive } from "../_shared/google-drive.ts";

// Se espera un multipart/form-data con:
//  - campo "modulo_id": uuid del módulo
//  - campo "foto": el archivo de imagen
//  - campo "descripcion": texto opcional para la foto
Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    await requireAdmin(req, adminClient);

    const form = await req.formData();
    const moduloId = form.get("modulo_id");
    const archivo = form.get("foto");
    const descripcion = form.get("descripcion");

    if (!moduloId || typeof moduloId !== "string") {
      return new Response(JSON.stringify({ error: "modulo_id es obligatorio" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!archivo || !(archivo instanceof File)) {
      return new Response(JSON.stringify({ error: "foto es obligatoria" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data: modulo, error: errorModulo } = await adminClient
      .from("modulos")
      .select("drive_folder_id")
      .eq("id", moduloId)
      .single();

    if (errorModulo || !modulo) {
      return new Response(JSON.stringify({ error: "Módulo no encontrado" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const driveFileId = await subirArchivoADrive(
      modulo.drive_folder_id,
      archivo.name,
      bytes,
      archivo.type || "application/octet-stream",
    );

    const { count } = await adminClient
      .from("modulo_fotos")
      .select("id", { count: "exact", head: true })
      .eq("modulo_id", moduloId);

    const { data: foto, error: errorFoto } = await adminClient
      .from("modulo_fotos")
      .insert({
        modulo_id: moduloId,
        drive_file_id: driveFileId,
        url_publica: urlMiniaturaDrive(driveFileId),
        descripcion: typeof descripcion === "string" && descripcion.trim()
          ? descripcion.trim()
          : null,
        orden: count ?? 0,
      })
      .select()
      .single();

    if (errorFoto) {
      return new Response(JSON.stringify({ error: errorFoto.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(foto), {
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
