import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Rol, PermisosUsuario } from '../types';

interface Props {
  children: ReactNode;
  rolesPermitidos?: Rol[];
  seccion?: keyof PermisosUsuario['pestanas'];
}

export function ProtectedRoute({ children, rolesPermitidos, seccion }: Props) {
  const { session, perfil, cargando, tieneAcceso } = useAuth();

  if (cargando) return <p>Cargando...</p>;
  if (!session)  return <Navigate to="/login" replace />;

  if (rolesPermitidos && (!perfil || !rolesPermitidos.includes(perfil.rol))) {
    return <Navigate to="/" replace />;
  }

  if (seccion && !tieneAcceso(seccion)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
