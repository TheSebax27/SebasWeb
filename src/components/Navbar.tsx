import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Módulos' },
  { to: '/finanzas', label: 'Finanzas' },
  { to: '/metas', label: 'Metas' },
  { to: '/gym', label: 'Gym' },
  { to: '/notas', label: 'Notas' },
  { to: '/entretenimiento', label: 'Entretenimiento' },
];

export function Navbar() {
  const { perfil, cerrarSesion } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.5rem 1rem',
      borderBottom: '1px solid #ddd',
      flexWrap: 'wrap',
    }}>
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: pathname === to ? 600 : 400,
            background: pathname === to ? '#e8f0fe' : 'transparent',
            color: pathname === to ? '#1a73e8' : 'inherit',
          }}
        >
          {label}
        </Link>
      ))}

      {perfil?.rol === 'admin' && (
        <Link
          to="/usuarios"
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: pathname === '/usuarios' ? 600 : 400,
            background: pathname === '/usuarios' ? '#e8f0fe' : 'transparent',
            color: pathname === '/usuarios' ? '#1a73e8' : 'inherit',
          }}
        >
          Usuarios
        </Link>
      )}

      <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#666' }}>
        {perfil?.nombre ?? perfil?.email}
      </span>
      <button
        onClick={cerrarSesion}
        style={{ padding: '0.35rem 0.75rem', borderRadius: 6, cursor: 'pointer' }}
      >
        Salir
      </button>
    </nav>
  );
}
