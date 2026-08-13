import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo, Submodulo, SubmoduloFoto } from '../types';
import { PageHeader, Btn, Field, EmptyState, ConfirmDialog, Icon, inputCls, textareaCls } from '../components/UI';

export function SubmoduloDetalle() {
  const { id, subId } = useParams<{ id: string; subId: string }>();
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [submodulo, setSubmodulo] = useState<Submodulo | null>(null);
  const [fotos, setFotos] = useState<SubmoduloFoto[]>([]);

  // Subir foto
  const [subiendo, setSubiendo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Editar sub-tablero
  const [editandoSub, setEditandoSub] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [guardandoSub, setGuardandoSub] = useState(false);

  // Eliminar sub-tablero
  const [confirmEliminarSub, setConfirmEliminarSub] = useState(false);

  // Fotos: editar descripción / eliminar
  const [editandoFoto, setEditandoFoto] = useState<string | null>(null);
  const [fotoDescEdit, setFotoDescEdit] = useState('');
  const [confirmFoto, setConfirmFoto] = useState<SubmoduloFoto | null>(null);

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

  /* ── Subir foto ── */
  async function subirFoto() {
    if (!archivoSeleccionado || !subId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setUploadError('Sesión expirada'); return; }
    setSubiendo(true); setUploadError(null);
    const formData = new FormData();
    formData.append('submodulo_id', subId);
    formData.append('foto', archivoSeleccionado);
    formData.append('descripcion', descripcion.trim());
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subir-foto-submodulo`, {
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

  /* ── Editar sub-tablero ── */
  function iniciarEdicion() {
    if (!submodulo) return;
    setEditNombre(submodulo.nombre);
    setEditDesc(submodulo.descripcion ?? '');
    setEditandoSub(true);
  }

  async function guardarSub() {
    if (!editNombre.trim() || !subId) return;
    setGuardandoSub(true);
    await supabase.from('submodulos').update({ nombre: editNombre.trim(), descripcion: editDesc.trim() || null }).eq('id', subId);
    setGuardandoSub(false);
    setEditandoSub(false);
    cargarDatos();
  }

  /* ── Eliminar sub-tablero ── */
  async function eliminarSubmodulo() {
    if (!subId) return;
    await supabase.from('submodulos').delete().eq('id', subId);
    navigate(`/modulos/${id}`);
  }

  /* ── Fotos: editar descripción ── */
  async function guardarDescFoto(fotoId: string) {
    await supabase.from('submodulo_fotos').update({ descripcion: fotoDescEdit.trim() || null }).eq('id', fotoId);
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
        body: JSON.stringify({ foto_id: confirmFoto.id, tipo: 'submodulo' }),
      });
    }
    setConfirmFoto(null);
    cargarDatos();
  }

  if (!submodulo) return <div className="max-w-5xl mx-auto px-6 py-8"><p className="text-sm text-gray-600">Cargando...</p></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-5">
        <Link to="/" className="hover:text-gray-400 transition-colors">Tableros</Link>
        <span className="text-gray-700">›</span>
        <Link to={`/modulos/${id}`} className="hover:text-gray-400 transition-colors">{modulo?.nombre ?? '...'}</Link>
        <span className="text-gray-700">›</span>
        <span className="text-gray-400">{submodulo.nombre}</span>
      </div>

      {/* Header con edición inline */}
      {editandoSub ? (
        <div className="mb-8 pb-6 border-b border-gray-800 flex flex-col gap-3 max-w-lg">
          <input className={inputCls} value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre del sub-tablero" autoFocus />
          <textarea className={textareaCls} rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Descripción (opcional)" />
          <div className="flex gap-2">
            <Btn variant="primary" size="sm" onClick={guardarSub} disabled={guardandoSub}>{guardandoSub ? 'Guardando...' : 'Guardar'}</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setEditandoSub(false)}>Cancelar</Btn>
          </div>
        </div>
      ) : (
        <PageHeader
          num="01 / SUB-MÓDULOS"
          title={submodulo.nombre}
          sub={submodulo.descripcion ?? undefined}
          actions={
            perfil?.rol === 'admin' && (
              <>
                <Btn variant="ghost" size="sm" onClick={iniciarEdicion}>
                  <Icon.Pencil className="w-3.5 h-3.5" /> Editar
                </Btn>
                <Btn
                  variant="ghost" size="sm"
                  onClick={() => setConfirmEliminarSub(true)}
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
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Agregar foto</p>
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

      {/* Galería de fotos */}
      {fotos.length === 0 ? (
        <EmptyState message="Todavía no hay fotos en este sub-tablero." />
      ) : (
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
              <img src={f.url_publica ?? ''} alt={f.descripcion ?? submodulo.nombre} className="w-full object-cover aspect-square" />

              {/* Descripción editable */}
              {editandoFoto === f.id ? (
                <div className="px-2 py-2 border-t border-gray-800 flex gap-1.5">
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
      )}

      {/* Dialogs de confirmación */}
      <ConfirmDialog
        open={confirmEliminarSub}
        title={`Eliminar sub-tablero "${submodulo.nombre}"`}
        message="Se eliminarán el sub-tablero y todas sus fotos permanentemente. Esta acción no se puede deshacer."
        onConfirm={eliminarSubmodulo}
        onCancel={() => setConfirmEliminarSub(false)}
      />
      <ConfirmDialog
        open={!!confirmFoto}
        title="Eliminar foto"
        message="Se eliminará esta foto permanentemente. El archivo seguirá en Drive pero no aparecerá en la app."
        onConfirm={eliminarFoto}
        onCancel={() => setConfirmFoto(null)}
      />
    </div>
  );
}
