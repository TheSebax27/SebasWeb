import { ChangeEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo, ModuloFoto } from '../types';

export function ModuloDetalle() {
  const { id } = useParams<{ id: string }>();
  const { perfil } = useAuth();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [fotos, setFotos] = useState<ModuloFoto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargarDatos() {
    const [{ data: moduloData }, { data: fotosData }] = await Promise.all([
      supabase.from('modulos').select('*').eq('id', id).single(),
      supabase.from('modulo_fotos').select('*').eq('modulo_id', id).order('orden'),
    ]);
    setModulo(moduloData as Modulo);
    setFotos((fotosData as ModuloFoto[]) ?? []);
  }

  useEffect(() => {
    if (id) cargarDatos();
  }, [id]);

  async function subirFoto(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo || !id) return;

    setSubiendo(true);
    setError(null);

    const formData = new FormData();
    formData.append('modulo_id', id);
    formData.append('foto', archivo);

    const { data: { session } } = await supabase.auth.getSession();

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subir-foto`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      },
    );

    setSubiendo(false);

    if (!resp.ok) {
      setError('No se pudo subir la foto');
      return;
    }

    await cargarDatos();
  }

  if (!modulo) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>{modulo.nombre}</h1>
      {modulo.descripcion && <p>{modulo.descripcion}</p>}

      {perfil?.rol === 'admin' && (
        <div style={{ margin: '1rem 0' }}>
          <label>
            {subiendo ? 'Subiendo...' : 'Agregar foto'}
            <input type="file" accept="image/*" onChange={subirFoto} disabled={subiendo} hidden />
          </label>
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
        {fotos.map((f) => (
          <img
            key={f.id}
            src={f.url_publica ?? ''}
            alt={modulo.nombre}
            style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '1' }}
          />
        ))}
      </div>
    </div>
  );
}
