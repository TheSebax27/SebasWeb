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
    <nav className="nav">
      <div className="nav-brand">S</div>
      <div className="nav-links">
        {LINKS.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-num">{l.num}</span>
            {l.label}
          </NavLink>
        ))}
        {perfil?.rol === 'admin' && (
          <NavLink
            to="/usuarios"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-num">07</span>
            Usuarios
          </NavLink>
        )}
      </div>
      <div className="nav-right">
        <span className="nav-user">{perfil?.nombre ?? perfil?.email}</span>
        <button
          onClick={logout}
          className="btn btn-text btn-sm"
          style={{ fontSize: '11px' }}
        >
          Salir
        </button>
      </div>
    </nav>
  );
}
