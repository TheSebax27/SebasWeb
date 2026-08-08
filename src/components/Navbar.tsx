import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { perfil, cerrarSesion } = useAuth();

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ddd' }}>
      <Link to="/">Módulos</Link>
      {perfil?.rol === 'admin' && <Link to="/usuarios">Usuarios</Link>}
      <span style={{ marginLeft: 'auto' }}>
        {perfil?.email} ({perfil?.rol})
      </span>
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </nav>
  );
}
