import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo } from '../types';

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

  if (cargando) return <p>Cargando módulos...</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Módulos</h1>
        {perfil?.rol === 'admin' && <Link to="/modulos/nuevo">+ Nuevo módulo</Link>}
      </div>

      {modulos.length === 0 && <p>Todavía no hay módulos creados.</p>}

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
        {modulos.map((m) => (
          <li key={m.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem' }}>
            <Link to={`/modulos/${m.id}`}>
              <strong>{m.nombre}</strong>
            </Link>
            {m.descripcion && <p>{m.descripcion}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
