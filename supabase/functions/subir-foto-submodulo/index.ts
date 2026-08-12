import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";
import { subirArchivoADrive, urlMiniaturaDrive } from "../_shared/google-drive.ts";

// Se espera un multipart/form-data con:
//  - campo "submodulo_id": uuid del submódulo
//  - campo "foto": el archivo de imagen
//  - campo "descripcion": texto opcional para la foto
Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    await requireAdmin(req, adminClient);

    const form = await req.formData();
    const submoduloId = form.get("submodulo_id");
    const archivo = form.get("foto");
    const descripcion = form.get("descripcion");

    if (!submoduloId || typeof submoduloId !== "string") {
      return new Response(JSON.stringify({ error: "submodulo_id es obligatorio" }), {
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

    const { data: submodulo, error: errorSub } = await adminClient
      .from("submodulos")
      .select("drive_folder_id")
      .eq("id", submoduloId)
      .single();

    if (errorSub || !submodulo) {
      return new Response(JSON.stringify({ error: "Submódulo no encontrado" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const driveFileId = await subirArchivoADrive(
      submodulo.drive_folder_id,
      archivo.name,
      bytes,
      archivo.type || "application/octet-stream",
    );

    const { count } = await adminClient
      .from("submodulo_fotos")
      .select("id", { count: "exact", head: true })
      .eq("submodulo_id", submoduloId);

    const { data: foto, error: errorFoto } = await adminClient
      .from("submodulo_fotos")
      .insert({
        submodulo_id: submoduloId,
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
