import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Icon, SparkleSeal, Wordmark } from './UI';
import { PermisosUsuario } from '../types';

interface LinkDef {
  to: string;
  label: string;
  seccion?: keyof PermisosUsuario['pestanas'];
  soloAdmin?: boolean;
}

const LINKS: LinkDef[] = [
  { to: '/',                label: 'Tableros',        seccion: 'galeria' },
  { to: '/finanzas',        label: 'Finanzas',        seccion: 'finanzas' },
  { to: '/metas',           label: 'Metas',           seccion: 'metas' },
  { to: '/gym',             label: 'Gym',             seccion: 'gym' },
  { to: '/notas',           label: 'Notas',           seccion: 'notas' },
  { to: '/entretenimiento', label: 'Entretenimiento', seccion: 'entretenimiento' },
  { to: '/usuarios',        label: 'Usuarios',        soloAdmin: true },
];

export default function Navbar() {
  const { perfil, tieneAcceso } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const iniciales = (perfil?.nombre ?? perfil?.email ?? '?').trim().charAt(0).toUpperCase();
  const esAdmin = perfil?.rol === 'admin';

  const linksVisibles = LINKS.filter(l => {
    if (l.soloAdmin) return esAdmin;
    if (esAdmin) return true;
    if (l.seccion) return tieneAcceso(l.seccion);
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-gray-800/80">
      <div className="max-w-6xl mx-auto flex items-center gap-1 h-16 px-4 sm:px-6">
        <div className="flex items-center gap-2.5 mr-6 shrink-0">
          <SparkleSeal size="sm" />
          <Wordmark size="sm" />
        </div>

        <div className="hidden sm:block w-px h-6 bg-gray-800 mr-2 shrink-0" />

        <div className="flex items-stretch gap-0.5 h-full flex-1 overflow-x-auto scrollbar-none">
          {linksVisibles.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) =>
                `relative flex items-center px-3 text-[12px] font-medium tracking-wide whitespace-nowrap transition-colors duration-150 ${
                  isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span className={`absolute left-3 right-3 -bottom-px h-[2px] rounded-full bg-emerald-500 transition-transform duration-200 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[11px] font-semibold text-emerald-400">
              {iniciales}
            </div>
            <span className="text-xs text-gray-400 max-w-[140px] truncate">{perfil?.nombre ?? perfil?.email}</span>
          </div>
          <button onClick={logout} title="Cerrar sesión"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors duration-150 cursor-pointer">
            <Icon.LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
