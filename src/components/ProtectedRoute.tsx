import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Rol } from '../types';

interface Props {
  children: ReactNode;
  rolesPermitidos?: Rol[];
}

export function ProtectedRoute({ children, rolesPermitidos }: Props) {
  const { session, perfil, cargando } = useAuth();

  if (cargando) return <p>Cargando...</p>;

  if (!session) return <Navigate to="/login" replace />;

  if (rolesPermitidos && (!perfil || !rolesPermitidos.includes(perfil.rol))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
