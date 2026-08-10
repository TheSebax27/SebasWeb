import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo } from '../types';
import { PageHeader, Btn, EmptyState } from '../components/UI';

export function Modulos() {
  const { perfil } = useAuth();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase
      .from('modulos')
      .select('*')
      .order('creado_en', { ascending: false })
      .then(({ data }) => {
        setModulos((data as Modulo[]) ?? []);
        setCargando(false);
      });
  }, []);

  return (
    <div className="page">
      <PageHeader
        num="01 / MÓDULOS"
        title="Módulos"
        sub="Galerías de contenido organizado"
        actions={
          perfil?.rol === 'admin' && (
            <Link to="/modulos/nuevo">
              <Btn variant="primary" size="sm">+ Nuevo módulo</Btn>
            </Link>
          )
        }
      />

      {cargando ? (
        <p className="text-2 text-sm">Cargando...</p>
      ) : modulos.length === 0 ? (
        <EmptyState message="Todavía no hay módulos creados." />
      ) : (
        <div className="modulo-grid">
          {modulos.map(m => (
            <Link key={m.id} to={`/modulos/${m.id}`}>
              <div className="modulo-card">
                <div className="text-md font-600">{m.nombre}</div>
                {m.descripcion && (
                  <div className="text-sm text-2 mt-xs truncate">{m.descripcion}</div>
                )}
                <div className="text-xs text-3 mt-sm">
                  {new Date(m.creado_en).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
