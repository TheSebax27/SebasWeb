import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Perfil, PermisosUsuario, SeccionPermiso, PERMISOS_DEFAULT } from '../types';

interface AuthContextValue {
  session: Session | null;
  perfil: Perfil | null;
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
  tieneAcceso: (seccion: SeccionPermiso) => boolean;
  puedeEditar: (seccion: SeccionPermiso) => boolean;
  puedeVerModulo: (moduloId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil]   = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setPerfil(null); setCargando(false); return; }
    setCargando(true);
    supabase.from('perfiles').select('*').eq('id', session.user.id).single()
      .then(({ data, error }) => {
        if (!error) setPerfil(data as Perfil);
        setCargando(false);
      });
  }, [session]);

  function resolverPermisos(): PermisosUsuario {
    const p = perfil?.permisos;
    if (!p) return PERMISOS_DEFAULT;
    return {
      pestanas: { ...PERMISOS_DEFAULT.pestanas, ...p.pestanas },
      edicion:  { ...PERMISOS_DEFAULT.edicion,  ...(p.edicion ?? {}) },
      modulos_todos: p.modulos_todos ?? true,
      modulos_ids:   p.modulos_ids   ?? [],
    };
  }

  function tieneAcceso(seccion: SeccionPermiso): boolean {
    if (!perfil) return false;
    if (perfil.rol === 'admin') return true;
    return resolverPermisos().pestanas[seccion] ?? false;
  }

  function puedeEditar(seccion: SeccionPermiso): boolean {
    if (!perfil) return false;
    if (perfil.rol === 'admin') return true;
    return resolverPermisos().edicion[seccion] ?? false;
  }

  function puedeVerModulo(moduloId: string): boolean {
    if (!perfil) return false;
    if (perfil.rol === 'admin') return true;
    const p = perfil.permisos ?? PERMISOS_DEFAULT;
    if (p.modulos_todos) return true;
    return p.modulos_ids.includes(moduloId);
  }

  async function cerrarSesion() { await supabase.auth.signOut(); }

  return (
    <AuthContext.Provider value={{ session, perfil, cargando, cerrarSesion, tieneAcceso, puedeEditar, puedeVerModulo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
