import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { crearClienteAdmin, requireAdmin } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const adminClient = crearClienteAdmin();

  try {
    await requireAdmin(req, adminClient);

    const { email, password, nombre, rol } = await req.json();

    if (!email || !password || !rol) {
      return new Response(
        JSON.stringify({ error: "email, password y rol son obligatorios" }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (!["admin", "visualizador"].includes(rol)) {
      return new Response(JSON.stringify({ error: "rol inválido" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Crear el usuario en Supabase Auth
    const { data: nuevoUsuario, error: errorCreacion } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // no requiere que confirme el correo
      });

    if (errorCreacion || !nuevoUsuario.user) {
      return new Response(
        JSON.stringify({ error: errorCreacion?.message ?? "No se pudo crear el usuario" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // 2. Insertar su perfil con el rol asignado
    const { error: errorPerfil } = await adminClient.from("perfiles").insert({
      id: nuevoUsuario.user.id,
      email,
      nombre: nombre ?? null,
      rol,
    });

    if (errorPerfil) {
      // Si falla el perfil, revertimos el usuario creado para no dejar basura
      await adminClient.auth.admin.deleteUser(nuevoUsuario.user.id);
      return new Response(JSON.stringify({ error: errorPerfil.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({ id: nuevoUsuario.user.id, email, rol }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
