import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const LINKS = [
  { to: '/',                num: '01', label: 'Módulos' },
  { to: '/finanzas',        num: '02', label: 'Finanzas' },
  { to: '/metas',           num: '03', label: 'Metas' },
  { to: '/gym',             num: '04', label: 'Gym' },
  { to: '/notas',           num: '05', label: 'Notas' },
  { to: '/entretenimiento', num: '06', label: 'Entretenimiento' },
];

export default function Navbar() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <nav className="sticky top-0 z-50 h-13 flex items-center gap-0 px-4 sm:px-6 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
      {/* Brand */}
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500 text-gray-950 text-xs font-bold mr-5 shrink-0 nav-glow">
        S
      </div>

      {/* Links */}
      <div className="flex items-stretch gap-0 h-full flex-1 overflow-x-auto scrollbar-none">
        {LINKS.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center px-3 text-[11px] font-medium tracking-wider uppercase border-b-2 whitespace-nowrap transition-colors duration-150 ${
                isActive
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-700'
              }`
            }
          >
            <span className="text-[9px] font-normal text-gray-600 mr-1">{l.num}</span>
            {l.label}
          </NavLink>
        ))}
        {perfil?.rol === 'admin' && (
          <NavLink
            to="/usuarios"
            className={({ isActive }) =>
              `flex items-center px-3 text-[11px] font-medium tracking-wider uppercase border-b-2 whitespace-nowrap transition-colors duration-150 ${
                isActive
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-700'
              }`
            }
          >
            <span className="text-[9px] font-normal text-gray-600 mr-1">07</span>
            Usuarios
          </NavLink>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className="hidden sm:block text-xs text-gray-600">{perfil?.nombre ?? perfil?.email}</span>
        <button
          onClick={logout}
          className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors duration-150 cursor-pointer"
        >
          Salir
        </button>
      </div>
    </nav>
  );
}
