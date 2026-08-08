import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Crea un cliente Supabase con la service_role key (acceso total,
 * bypassea RLS). SOLO se usa dentro de Edge Functions, nunca en el cliente.
 */
export function crearClienteAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Verifica que el JWT recibido en el header Authorization pertenece
 * a un usuario con rol 'admin' en la tabla perfiles.
 * Lanza un Response 401/403 (para responder directo) si falla.
 */
export async function requireAdmin(
  req: Request,
  adminClient: SupabaseClient,
): Promise<{ id: string; email: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Response(JSON.stringify({ error: "Falta token de autorización" }), {
      status: 401,
    });
  }

  const jwt = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);

  if (userError || !userData.user) {
    throw new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });
  }

  const { data: perfil, error: perfilError } = await adminClient
    .from("perfiles")
    .select("rol, activo")
    .eq("id", userData.user.id)
    .single();

  if (perfilError || !perfil || perfil.rol !== "admin" || !perfil.activo) {
    throw new Response(JSON.stringify({ error: "Requiere rol de administrador" }), {
      status: 403,
    });
  }

  return { id: userData.user.id, email: userData.user.email! };
}
