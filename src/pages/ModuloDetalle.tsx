import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo, ModuloFoto, Submodulo } from '../types';
import { PageHeader, Btn, Field, EmptyState, ConfirmDialog, Icon, inputCls, textareaCls } from '../components/UI';

export function ModuloDetalle() {
  const { id } = useParams<{ id: string }>();
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [fotos, setFotos] = useState<ModuloFoto[]>([]);
  const [submodulos, setSubmodulos] = useState<Submodulo[]>([]);

  // Subir foto
  const [subiendo, setSubiendo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Editar módulo
  const [editandoModulo, setEditandoModulo] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [guardandoModulo, setGuardandoModulo] = useState(false);

  // Eliminar módulo
  const [confirmEliminarModulo, setConfirmEliminarModulo] = useState(false);

  // Fotos: editar descripción / eliminar
  const [editandoFoto, setEditandoFoto] = useState<string | null>(null);
  const [fotoDescEdit, setFotoDescEdit] = useState('');
  const [confirmFoto, setConfirmFoto] = useState<ModuloFoto | null>(null);

  // Sub-tableros: crear / editar / eliminar
  const [mostrarFormSub, setMostrarFormSub] = useState(false);
  const [subNombre, setSubNombre] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [creandoSub, setCreandoSub] = useState(false);
  const [errorSub, setErrorSub] = useState<string | null>(null);
  const [editandoSub, setEditandoSub] = useState<string | null>(null);
  const [subEditForm, setSubEditForm] = useState({ nombre: '', descripcion: '' });
  const [guardandoSub, setGuardandoSub] = useState(false);
  const [confirmSub, setConfirmSub] = useState<Submodulo | null>(null);

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

  /* ── Subir foto ── */
  async function subirFoto() {
    if (!archivoSeleccionado || !id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setUploadError('Sesión expirada'); return; }
    setSubiendo(true); setUploadError(null);
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
      if (!resp.ok) { const c = await resp.json().catch(() => null); setUploadError(c?.error ?? 'Error al subir'); return; }
      setDescripcion(''); setArchivoSeleccionado(null);
      if (inputRef.current) inputRef.current.value = '';
      await cargarDatos();
    } catch { setUploadError('Error de conexión'); }
    finally { setSubiendo(false); }
  }

  /* ── Editar módulo ── */
  function iniciarEditarModulo() {
    if (!modulo) return;
    setEditNombre(modulo.nombre);
    setEditDesc(modulo.descripcion ?? '');
    setEditandoModulo(true);
  }

  async function guardarModulo() {
    if (!editNombre.trim() || !id) return;
    setGuardandoModulo(true);
    await supabase.from('modulos').update({ nombre: editNombre.trim(), descripcion: editDesc.trim() || null }).eq('id', id);
    setGuardandoModulo(false);
    setEditandoModulo(false);
    cargarDatos();
  }

  /* ── Eliminar módulo ── */
  async function eliminarModulo() {
    if (!id) return;
    await supabase.from('modulos').delete().eq('id', id);
    navigate('/');
  }

  /* ── Fotos: editar descripción ── */
  async function guardarDescFoto(fotoId: string) {
    await supabase.from('modulo_fotos').update({ descripcion: fotoDescEdit.trim() || null }).eq('id', fotoId);
    setEditandoFoto(null);
    cargarDatos();
  }

  /* ── Fotos: eliminar (Drive + BD) ── */
  async function eliminarFoto() {
    if (!confirmFoto) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eliminar-foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string, 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_id: confirmFoto.id, tipo: 'modulo' }),
      });
    }
    setConfirmFoto(null);
    cargarDatos();
  }

  /* ── Crear sub-tablero ── */
  async function crearSubmodulo() {
    if (!subNombre.trim()) { setErrorSub('El nombre es obligatorio'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setErrorSub('Sesión expirada'); return; }
    setCreandoSub(true); setErrorSub(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-submodulo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: subNombre.trim(), descripcion: subDesc.trim() || null, modulo_id: id }),
      });
      if (!resp.ok) { const c = await resp.json().catch(() => null); setErrorSub(c?.error ?? 'Error al crear'); return; }
      setSubNombre(''); setSubDesc(''); setMostrarFormSub(false);
      await cargarDatos();
    } catch { setErrorSub('Error de conexión'); }
    finally { setCreandoSub(false); }
  }

  /* ── Editar sub-tablero ── */
  function iniciarEditarSub(sub: Submodulo, e: React.MouseEvent) {
    e.stopPropagation();
    setEditandoSub(sub.id);
    setSubEditForm({ nombre: sub.nombre, descripcion: sub.descripcion ?? '' });
  }

  async function guardarSub(subId: string) {
    if (!subEditForm.nombre.trim()) return;
    setGuardandoSub(true);
    await supabase.from('submodulos').update({ nombre: subEditForm.nombre.trim(), descripcion: subEditForm.descripcion.trim() || null }).eq('id', subId);
    setGuardandoSub(false);
    setEditandoSub(null);
    cargarDatos();
  }

  /* ── Eliminar sub-tablero ── */
  async function eliminarSubmodulo() {
    if (!confirmSub) return;
    await supabase.from('submodulos').delete().eq('id', confirmSub.id);
    setConfirmSub(null);
    cargarDatos();
  }

  if (!modulo) return <div className="max-w-5xl mx-auto px-6 py-8"><p className="text-sm text-gray-600">Cargando...</p></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors mb-5">
        ← Tableros
      </Link>

      {/* Header con edición inline */}
      {editandoModulo ? (
        <div className="mb-8 pb-6 border-b border-gray-800 flex flex-col gap-3 max-w-lg">
          <input className={inputCls} value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre del tablero" autoFocus />
          <textarea className={textareaCls} rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Descripción (opcional)" />
          <div className="flex gap-2">
            <Btn variant="primary" size="sm" onClick={guardarModulo} disabled={guardandoModulo}>{guardandoModulo ? 'Guardando...' : 'Guardar'}</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setEditandoModulo(false)}>Cancelar</Btn>
          </div>
        </div>
      ) : (
        <PageHeader
          num="01 / MÓDULOS"
          title={modulo.nombre}
          sub={modulo.descripcion ?? undefined}
          actions={
            perfil?.rol === 'admin' && (
              <>
                <Btn variant="ghost" size="sm" onClick={iniciarEditarModulo}>
                  <Icon.Pencil className="w-3.5 h-3.5" /> Editar
                </Btn>
                <Btn
                  variant="ghost" size="sm"
                  onClick={() => setConfirmEliminarModulo(true)}
                  className="!text-rose-400 !border-rose-900 hover:!bg-rose-950"
                >
                  <Icon.Trash className="w-3.5 h-3.5" /> Eliminar
                </Btn>
              </>
            )
          }
        />
      )}

      {/* Subir foto */}
      {perfil?.rol === 'admin' && (
        <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-8 max-w-md flex flex-col gap-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Agregar foto al tablero</p>
          <Field label="Descripción (opcional)">
            <input className={inputCls} type="text" placeholder="Ej. Vista frontal" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2 flex-wrap">
            <Btn variant="ghost" size="sm" type="button" onClick={() => inputRef.current?.click()}>
              {archivoSeleccionado ? `📎 ${archivoSeleccionado.name}` : 'Seleccionar imagen'}
            </Btn>
            <input ref={inputRef} type="file" accept="image/*" onChange={e => { setArchivoSeleccionado(e.target.files?.[0] ?? null); setUploadError(null); }} hidden />
            {archivoSeleccionado && (
              <Btn variant="primary" size="sm" type="button" onClick={subirFoto} disabled={subiendo}>
                {subiendo ? 'Subiendo...' : 'Subir'}
              </Btn>
            )}
          </div>
          {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
        </div>
      )}

      {/* Fotos del módulo */}
      {fotos.length > 0 && (
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-3">Fotos</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {fotos.map(f => (
              <div key={f.id} className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden group relative">
                {perfil?.rol === 'admin' && (
                  <button
                    onClick={() => setConfirmFoto(f)}
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 w-7 h-7 bg-gray-950/80 hover:bg-rose-950 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
                    title="Eliminar foto"
                  >
                    <Icon.Trash className="w-3.5 h-3.5" />
                  </button>
                )}
                <img src={f.url_publica ?? ''} alt={f.descripcion ?? modulo.nombre} className="w-full object-cover aspect-square" />

                {/* Descripción editable */}
                {editandoFoto === f.id ? (
                  <div className="px-2 py-2 border-t border-gray-800 flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <input
                      className={`${inputCls} text-xs py-1`}
                      value={fotoDescEdit}
                      onChange={e => setFotoDescEdit(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') guardarDescFoto(f.id); if (e.key === 'Escape') setEditandoFoto(null); }}
                      autoFocus
                    />
                    <button onClick={() => guardarDescFoto(f.id)} className="text-emerald-400 hover:text-emerald-300 cursor-pointer shrink-0">
                      <Icon.Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditandoFoto(null)} className="text-gray-600 hover:text-gray-400 cursor-pointer shrink-0">
                      <Icon.X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  (f.descripcion || perfil?.rol === 'admin') && (
                    <div
                      className={`px-3 py-2 border-t border-gray-800 flex items-center justify-between gap-2 ${perfil?.rol === 'admin' ? 'cursor-pointer hover:bg-gray-800/40' : ''} transition-colors`}
                      onClick={() => { if (perfil?.rol === 'admin') { setEditandoFoto(f.id); setFotoDescEdit(f.descripcion ?? ''); } }}
                      title={perfil?.rol === 'admin' ? 'Clic para editar descripción' : undefined}
                    >
                      <span className="text-xs text-gray-400 truncate">{f.descripcion || <span className="text-gray-700 italic">Sin descripción</span>}</span>
                      {perfil?.rol === 'admin' && <Icon.Pencil className="w-3 h-3 text-gray-600 shrink-0" />}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tableros */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Sub-tableros</p>
            <p className="text-xs text-gray-600 mt-0.5">Organiza el contenido en carpetas más específicas</p>
          </div>
          {perfil?.rol === 'admin' && (
            <Btn variant="ghost" size="sm" onClick={() => { setMostrarFormSub(f => !f); setErrorSub(null); }}>
              {mostrarFormSub ? 'Cancelar' : '+ Nuevo sub-tablero'}
            </Btn>
          )}
        </div>

        {mostrarFormSub && (
          <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-5 max-w-md flex flex-col gap-4">
            <Field label="Nombre">
              <input className={inputCls} placeholder="Ej. Camisas, Verano 2024..." value={subNombre} onChange={e => setSubNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && crearSubmodulo()} autoFocus />
            </Field>
            <Field label="Descripción (opcional)">
              <textarea className={textareaCls} rows={2} placeholder="Descripción breve" value={subDesc} onChange={e => setSubDesc(e.target.value)} />
            </Field>
            {errorSub && <p className="text-xs text-rose-400">{errorSub}</p>}
            <Btn variant="primary" onClick={crearSubmodulo} disabled={creandoSub}>{creandoSub ? 'Creando carpeta...' : 'Crear sub-tablero'}</Btn>
          </div>
        )}

        {submodulos.length === 0 && !mostrarFormSub ? (
          <EmptyState message="No hay sub-tableros. Crea uno para organizar mejor el contenido." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {submodulos.map(sub => (
              <div key={sub.id} className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden group">
                {editandoSub === sub.id ? (
                  <div className="p-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                    <input className={inputCls} value={subEditForm.nombre} onChange={e => setSubEditForm({ ...subEditForm, nombre: e.target.value })} autoFocus />
                    <textarea className={textareaCls} rows={2} value={subEditForm.descripcion} onChange={e => setSubEditForm({ ...subEditForm, descripcion: e.target.value })} />
                    <div className="flex gap-2">
                      <Btn variant="primary" size="sm" onClick={() => guardarSub(sub.id)} disabled={guardandoSub}>{guardandoSub ? 'Guardando...' : 'Guardar'}</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => setEditandoSub(null)}>Cancelar</Btn>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => navigate(`/modulos/${id}/submodulos/${sub.id}`)}
                    className="p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-emerald-500/70 shrink-0">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                        </span>
                        <span className="font-medium text-sm text-gray-200 group-hover:text-emerald-400 transition-colors truncate">{sub.nombre}</span>
                      </div>
                      {perfil?.rol === 'admin' && (
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => iniciarEditarSub(sub, e)} className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer" title="Editar">
                            <Icon.Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); setConfirmSub(sub); }} className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer" title="Eliminar">
                            <Icon.Trash className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {sub.descripcion && <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2 pl-7">{sub.descripcion}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs de confirmación */}
      <ConfirmDialog
        open={confirmEliminarModulo}
        title={`Eliminar tablero "${modulo.nombre}"`}
        message="Se eliminarán el tablero, todas sus fotos y todos sus sub-tableros permanentemente. Esta acción no se puede deshacer."
        onConfirm={eliminarModulo}
        onCancel={() => setConfirmEliminarModulo(false)}
      />
      <ConfirmDialog
        open={!!confirmFoto}
        title="Eliminar foto"
        message="Se eliminará esta foto permanentemente. El archivo seguirá en Drive pero no aparecerá en la app."
        onConfirm={eliminarFoto}
        onCancel={() => setConfirmFoto(null)}
      />
      <ConfirmDialog
        open={!!confirmSub}
        title={`Eliminar "${confirmSub?.nombre}"`}
        message="Se eliminarán el sub-tablero y todas sus fotos permanentemente. Esta acción no se puede deshacer."
        onConfirm={eliminarSubmodulo}
        onCancel={() => setConfirmSub(null)}
      />
    </div>
  );
}
