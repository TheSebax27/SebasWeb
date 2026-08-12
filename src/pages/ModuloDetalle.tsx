import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo, ModuloFoto, Submodulo } from '../types';
import { PageHeader, Btn, Field, EmptyState, inputCls, textareaCls } from '../components/UI';

export function ModuloDetalle() {
  const { id } = useParams<{ id: string }>();
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [fotos, setFotos] = useState<ModuloFoto[]>([]);
  const [submodulos, setSubmodulos] = useState<Submodulo[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Form crear submódulo
  const [mostrarFormSub, setMostrarFormSub] = useState(false);
  const [subNombre, setSubNombre] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [creandoSub, setCreandoSub] = useState(false);
  const [errorSub, setErrorSub] = useState<string | null>(null);

  async function cargarDatos() {
    const [{ data: moduloData }, { data: fotosData }, { data: subsData }] = await Promise.all([
      supabase.from('modulos').select('*').eq('id', id).single(),
      supabase.from('modulo_fotos').select('*').eq('modulo_id', id).order('orden'),
      supabase.from('submodulos').select('*').eq('modulo_id', id).order('creado_en'),
    ]);
    setModulo(moduloData as Modulo);
    setFotos((fotosData as ModuloFoto[]) ?? []);
    setSubmodulos((subsData as Submodulo[]) ?? []);
  }

  useEffect(() => { if (id) cargarDatos(); }, [id]);

  async function subirFoto() {
    if (!archivoSeleccionado || !id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Sesión expirada'); return; }
    setSubiendo(true); setError(null);
    const formData = new FormData();
    formData.append('modulo_id', id);
    formData.append('foto', archivoSeleccionado);
    formData.append('descripcion', descripcion.trim());
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subir-foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string },
        body: formData,
      });
      if (!resp.ok) { const c = await resp.json().catch(() => null); setError(c?.error ?? 'Error al subir'); return; }
      setDescripcion(''); setArchivoSeleccionado(null);
      if (inputRef.current) inputRef.current.value = '';
      await cargarDatos();
    } catch { setError('Error de conexión'); }
    finally { setSubiendo(false); }
  }

  async function crearSubmodulo() {
    if (!subNombre.trim()) { setErrorSub('El nombre es obligatorio'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setErrorSub('Sesión expirada'); return; }
    setCreandoSub(true); setErrorSub(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-submodulo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: subNombre.trim(), descripcion: subDesc.trim() || null, modulo_id: id }),
      });
      if (!resp.ok) { const c = await resp.json().catch(() => null); setErrorSub(c?.error ?? 'Error al crear'); return; }
      setSubNombre(''); setSubDesc(''); setMostrarFormSub(false);
      await cargarDatos();
    } catch { setErrorSub('Error de conexión'); }
    finally { setCreandoSub(false); }
  }

  async function eliminarSubmodulo(subId: string, nombre: string) {
    if (!confirm(`¿Eliminar el submódulo "${nombre}"? Se borrarán todas sus fotos.`)) return;
    await supabase.from('submodulos').delete().eq('id', subId);
    setSubmodulos(p => p.filter(s => s.id !== subId));
  }

  if (!modulo) return <div className="max-w-5xl mx-auto px-6 py-8"><p className="text-sm text-gray-600">Cargando...</p></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors mb-5">
        ← Módulos
      </Link>

      <PageHeader num="01 / MÓDULOS" title={modulo.nombre} sub={modulo.descripcion ?? undefined} />

      {/* Subir foto al módulo */}
      {perfil?.rol === 'admin' && (
        <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-8 max-w-md flex flex-col gap-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Agregar foto al módulo</p>
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

      {/* Fotos del módulo */}
      {fotos.length > 0 && (
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-3">Fotos</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {fotos.map(f => (
              <div key={f.id} className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
                <img src={f.url_publica ?? ''} alt={f.descripcion ?? modulo.nombre} className="w-full object-cover aspect-square" />
                {f.descripcion && (
                  <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-800">{f.descripcion}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-módulos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Sub-módulos</p>
            <p className="text-xs text-gray-600 mt-0.5">Organiza el contenido en carpetas más específicas</p>
          </div>
          {perfil?.rol === 'admin' && (
            <Btn variant="ghost" size="sm" onClick={() => { setMostrarFormSub(f => !f); setErrorSub(null); }}>
              {mostrarFormSub ? 'Cancelar' : '+ Nuevo sub-módulo'}
            </Btn>
          )}
        </div>

        {mostrarFormSub && (
          <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-5 max-w-md flex flex-col gap-4">
            <Field label="Nombre">
              <input
                className={inputCls}
                placeholder="Ej. Camisas, Verano 2024..."
                value={subNombre}
                onChange={e => setSubNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && crearSubmodulo()}
                autoFocus
              />
            </Field>
            <Field label="Descripción (opcional)">
              <textarea className={textareaCls} rows={2} placeholder="Descripción breve" value={subDesc} onChange={e => setSubDesc(e.target.value)} />
            </Field>
            {errorSub && <p className="text-xs text-rose-400">{errorSub}</p>}
            <Btn variant="primary" onClick={crearSubmodulo} disabled={creandoSub}>
              {creandoSub ? 'Creando carpeta...' : 'Crear sub-módulo'}
            </Btn>
          </div>
        )}

        {submodulos.length === 0 && !mostrarFormSub ? (
          <EmptyState message="No hay sub-módulos. Crea uno para organizar mejor el contenido." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {submodulos.map(sub => (
              <div
                key={sub.id}
                onClick={() => navigate(`/modulos/${id}/submodulos/${sub.id}`)}
                className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 hover:border-emerald-800/60 rounded-xl p-4 cursor-pointer transition-all duration-150 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-emerald-500/70 shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </span>
                    <span className="font-medium text-sm text-gray-200 group-hover:text-emerald-400 transition-colors truncate">
                      {sub.nombre}
                    </span>
                  </div>
                  {perfil?.rol === 'admin' && (
                    <button
                      onClick={e => { e.stopPropagation(); eliminarSubmodulo(sub.id, sub.nombre); }}
                      className="shrink-0 text-gray-700 hover:text-rose-400 transition-colors text-xs p-1 rounded cursor-pointer"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {sub.descripcion && (
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2 pl-7">{sub.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
