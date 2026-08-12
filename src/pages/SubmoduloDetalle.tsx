import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo, Submodulo, SubmoduloFoto } from '../types';
import { PageHeader, Btn, Field, EmptyState, inputCls } from '../components/UI';

export function SubmoduloDetalle() {
  const { id, subId } = useParams<{ id: string; subId: string }>();
  const { perfil } = useAuth();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [submodulo, setSubmodulo] = useState<Submodulo | null>(null);
  const [fotos, setFotos] = useState<SubmoduloFoto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function cargarDatos() {
    const [{ data: moduloData }, { data: subData }, { data: fotosData }] = await Promise.all([
      supabase.from('modulos').select('*').eq('id', id).single(),
      supabase.from('submodulos').select('*').eq('id', subId).single(),
      supabase.from('submodulo_fotos').select('*').eq('submodulo_id', subId).order('orden'),
    ]);
    setModulo(moduloData as Modulo);
    setSubmodulo(subData as Submodulo);
    setFotos((fotosData as SubmoduloFoto[]) ?? []);
  }

  useEffect(() => { if (id && subId) cargarDatos(); }, [id, subId]);

  async function subirFoto() {
    if (!archivoSeleccionado || !subId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Sesión expirada'); return; }
    setSubiendo(true); setError(null);
    const formData = new FormData();
    formData.append('submodulo_id', subId);
    formData.append('foto', archivoSeleccionado);
    formData.append('descripcion', descripcion.trim());
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subir-foto-submodulo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: formData,
      });
      if (!resp.ok) { const c = await resp.json().catch(() => null); setError(c?.error ?? 'Error al subir'); return; }
      setDescripcion(''); setArchivoSeleccionado(null);
      if (inputRef.current) inputRef.current.value = '';
      await cargarDatos();
    } catch { setError('Error de conexión'); }
    finally { setSubiendo(false); }
  }

  if (!submodulo) return <div className="max-w-5xl mx-auto px-6 py-8"><p className="text-sm text-gray-600">Cargando...</p></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-5">
        <Link to="/" className="hover:text-gray-400 transition-colors">Módulos</Link>
        <span className="text-gray-700">›</span>
        <Link to={`/modulos/${id}`} className="hover:text-gray-400 transition-colors">{modulo?.nombre ?? '...'}</Link>
        <span className="text-gray-700">›</span>
        <span className="text-gray-400">{submodulo.nombre}</span>
      </div>

      <PageHeader num="01 / SUB-MÓDULOS" title={submodulo.nombre} sub={submodulo.descripcion ?? undefined} />

      {perfil?.rol === 'admin' && (
        <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-8 max-w-md flex flex-col gap-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Agregar foto</p>
          <Field label="Descripción (opcional)">
            <input className={inputCls} type="text" placeholder="Ej. Vista frontal" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2 flex-wrap">
            <Btn variant="ghost" size="sm" type="button" onClick={() => inputRef.current?.click()}>
              {archivoSeleccionado ? `📎 ${archivoSeleccionado.name}` : 'Seleccionar imagen'}
            </Btn>
            <input ref={inputRef} type="file" accept="image/*" onChange={e => { setArchivoSeleccionado(e.target.files?.[0] ?? null); setError(null); }} hidden />
            {archivoSeleccionado && (
              <Btn variant="primary" size="sm" type="button" onClick={subirFoto} disabled={subiendo}>
                {subiendo ? 'Subiendo...' : 'Subir'}
              </Btn>
            )}
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
      )}

      {fotos.length === 0 ? (
        <EmptyState message="Todavía no hay fotos en este sub-módulo." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {fotos.map(f => (
            <div key={f.id} className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
              <img src={f.url_publica ?? ''} alt={f.descripcion ?? submodulo.nombre} className="w-full object-cover aspect-square" />
              {f.descripcion && (
                <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-800">{f.descripcion}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
