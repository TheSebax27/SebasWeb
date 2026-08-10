import { useEffect, useRef, useState } from 'react';
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
  const [descripcion, setDescripcion] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function seleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] ?? null;
    setArchivoSeleccionado(archivo);
    setError(null);
  }

  async function subirFoto() {
    if (!archivoSeleccionado || !id) return;

    const { data: { session }, error: errorSesion } = await supabase.auth.getSession();
    if (errorSesion || !session) {
      setError('Tu sesión expiró. Cierra sesión y vuelve a entrar.');
      return;
    }

    setSubiendo(true);
    setError(null);

    const formData = new FormData();
    formData.append('modulo_id', id);
    formData.append('foto', archivoSeleccionado);
    formData.append('descripcion', descripcion.trim());

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subir-foto`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: formData,
        },
      );

      if (!resp.ok) {
        const cuerpo = await resp.json().catch(() => null);
        setError(cuerpo?.error ?? 'No se pudo subir la foto');
        return;
      }

      setDescripcion('');
      setArchivoSeleccionado(null);
      if (inputRef.current) inputRef.current.value = '';
      await cargarDatos();
    } catch {
      setError('Error de conexión al subir la foto');
    } finally {
      setSubiendo(false);
    }
  }

  if (!modulo) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>{modulo.nombre}</h1>
      {modulo.descripcion && <p style={{ color: '#555' }}>{modulo.descripcion}</p>}

      {perfil?.rol === 'admin' && (
        <div style={{
          margin: '1.25rem 0',
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: 480,
        }}>
          <strong>Agregar foto</strong>

          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer' }}
            >
              {archivoSeleccionado ? '📎 ' + archivoSeleccionado.name : 'Seleccionar imagen'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={seleccionarArchivo}
              hidden
            />
            {archivoSeleccionado && (
              <button
                type="button"
                onClick={subirFoto}
                disabled={subiendo}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: '#1a73e8',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {subiendo ? 'Subiendo...' : 'Subir'}
              </button>
            )}
          </div>

          {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        {fotos.map((f) => (
          <div key={f.id} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' }}>
            <img
              src={f.url_publica ?? ''}
              alt={f.descripcion ?? modulo.nombre}
              style={{ width: '100%', objectFit: 'cover', aspectRatio: '1', display: 'block' }}
            />
            {f.descripcion && (
              <p style={{
                margin: 0,
                padding: '0.5rem 0.6rem',
                fontSize: '0.85rem',
                color: '#444',
                background: '#fafafa',
              }}>
                {f.descripcion}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
