import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo, ModuloFoto } from '../types';
import { PageHeader, Btn, Field, EmptyState } from '../components/UI';

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

  useEffect(() => { if (id) cargarDatos(); }, [id]);

  function seleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setArchivoSeleccionado(e.target.files?.[0] ?? null);
    setError(null);
  }

  async function subirFoto() {
    if (!archivoSeleccionado || !id) return;
    const { data: { session }, error: errorSesion } = await supabase.auth.getSession();
    if (errorSesion || !session) { setError('Sesión expirada'); return; }

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
      setError('Error de conexión');
    } finally {
      setSubiendo(false);
    }
  }

  if (!modulo) return <div className="page"><p className="text-2 text-sm">Cargando...</p></div>;

  return (
    <div className="page page-wide">
      <div className="flex items-center gap-sm mb-md">
        <Link to="/" className="text-sm text-3">← Módulos</Link>
      </div>

      <PageHeader
        num="01 / MÓDULOS"
        title={modulo.nombre}
        sub={modulo.descripcion ?? undefined}
      />

      {perfil?.rol === 'admin' && (
        <div className="upload-area mb-lg">
          <div className="text-xs uppercase text-2 font-500" style={{ letterSpacing: '0.07em' }}>Agregar foto</div>

          <Field label="Descripción (opcional)">
            <input
              className="input"
              type="text"
              placeholder="Ej. Vista frontal"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </Field>

          <div className="flex gap-sm items-center flex-wrap">
            <Btn variant="ghost" size="sm" type="button" onClick={() => inputRef.current?.click()}>
              {archivoSeleccionado ? `📎 ${archivoSeleccionado.name}` : 'Seleccionar imagen'}
            </Btn>
            <input ref={inputRef} type="file" accept="image/*" onChange={seleccionarArchivo} hidden />
            {archivoSeleccionado && (
              <Btn variant="primary" size="sm" type="button" onClick={subirFoto} disabled={subiendo}>
                {subiendo ? 'Subiendo...' : 'Subir'}
              </Btn>
            )}
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>
      )}

      {fotos.length === 0 ? (
        <EmptyState message="Todavía no hay fotos en este módulo." />
      ) : (
        <div className="photo-grid">
          {fotos.map(f => (
            <div key={f.id} className="photo-item">
              <img
                src={f.url_publica ?? ''}
                alt={f.descripcion ?? modulo.nombre}
                style={{ width: '100%', objectFit: 'cover', aspectRatio: '1' }}
              />
              {f.descripcion && (
                <div className="photo-caption">{f.descripcion}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
