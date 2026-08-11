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
    supabase.from('modulos').select('*').order('creado_en', { ascending: false })
      .then(({ data }) => { setModulos((data as Modulo[]) ?? []); setCargando(false); });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
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
        <p className="text-sm text-gray-600">Cargando...</p>
      ) : modulos.length === 0 ? (
        <EmptyState message="Todavía no hay módulos creados." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modulos.map(m => (
            <Link key={m.id} to={`/modulos/${m.id}`}>
              <div className="group bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:bg-gray-900/80 transition-all duration-200 cursor-pointer">
                <div className="text-sm font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors duration-150">
                  {m.nombre}
                </div>
                {m.descripcion && (
                  <div className="mt-1 text-xs text-gray-500 truncate">{m.descripcion}</div>
                )}
                <div className="mt-4 text-[10px] text-gray-700">
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
