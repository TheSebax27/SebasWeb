import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { EntretenimientoItem, TipoEntretenimiento, EstadoEntretenimiento } from '../types';
import { PageHeader, Btn, Field, EmptyState, ConfirmDialog, StatTile, Icon, inputCls, textareaCls, selectCls } from '../components/UI';

/* ── Constantes ─────────────────────────────────────────── */
export const TIPOS: { valor: TipoEntretenimiento; label: string; emoji: string }[] = [
  { valor: 'pelicula', label: 'Películas', emoji: '🎬' },
  { valor: 'serie',    label: 'Series',    emoji: '📺' },
  { valor: 'juego',    label: 'Juegos',    emoji: '🎮' },
];

export const ESTADOS: { valor: EstadoEntretenimiento; label: string; cls: string }[] = [
  { valor: 'quiero',      label: 'Lo quiero',   cls: 'bg-gray-800 text-gray-400 border-gray-700' },
  { valor: 'en_progreso', label: 'En progreso', cls: 'bg-amber-950/50 text-amber-400 border-amber-900' },
  { valor: 'visto',       label: 'Completado',  cls: 'bg-emerald-950/50 text-emerald-400 border-emerald-900' },
];

export const PLATAFORMAS: Record<TipoEntretenimiento, string[]> = {
  pelicula: ['Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'Apple TV+', 'Sala de cine', 'YouTube', 'Otros'],
  serie:    ['Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'Apple TV+', 'YouTube', 'Otros'],
  juego:    ['PS5', 'PS4', 'Xbox', 'PC / Steam', 'Nintendo Switch', 'Mobile', 'Otros'],
};

type Orden = 'reciente' | 'rating' | 'alfa';

function estadoCls(e: EstadoEntretenimiento)   { return ESTADOS.find(x => x.valor === e)?.cls ?? ''; }
function estadoLabel(e: EstadoEntretenimiento) { return ESTADOS.find(x => x.valor === e)?.label ?? e; }

function plataformaCls(p: string): string {
  if (p === 'Netflix')                         return 'bg-red-950/50 text-red-400 border-red-900/60';
  if (p === 'Prime Video')                     return 'bg-cyan-950/50 text-cyan-400 border-cyan-900/60';
  if (p === 'Disney+')                         return 'bg-blue-950/50 text-blue-400 border-blue-900/60';
  if (p === 'HBO Max')                         return 'bg-violet-950/50 text-violet-400 border-violet-900/60';
  if (p === 'Apple TV+')                       return 'bg-gray-800 text-gray-300 border-gray-700';
  if (p === 'PS5' || p === 'PS4')              return 'bg-blue-950/50 text-blue-400 border-blue-900/60';
  if (p === 'Xbox')                            return 'bg-green-950/50 text-green-400 border-green-900/60';
  if (p.includes('Steam') || p.includes('PC')) return 'bg-gray-800 text-gray-300 border-gray-700';
  if (p === 'Nintendo Switch')                 return 'bg-red-950/50 text-red-400 border-red-900/60';
  return 'bg-gray-800 text-gray-500 border-gray-700';
}

/* ── Sub-componentes ────────────────────────────────────── */
function Estrellas({ rating, onChange }: { rating: number | null; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} onClick={() => onChange?.(n)}
          className={`text-sm leading-none transition-colors ${n <= (rating ?? 0) ? 'text-amber-400' : 'text-gray-700'} ${onChange ? 'cursor-pointer hover:text-amber-300' : ''}`}>
          ★
        </span>
      ))}
    </div>
  );
}

interface CardProps {
  item: EntretenimientoItem;
  esAdmin: boolean;
  subiendoPortadaId: string | null;
  onEliminar: (item: EntretenimientoItem) => void;
  onCambiarPortada: (itemId: string, file: File, tipo: string) => void;
  onEstado: (item: EntretenimientoItem, estado: EstadoEntretenimiento) => void;
  onRating: (item: EntretenimientoItem, rating: number) => void;
  onRenombrar: (item: EntretenimientoItem, nuevoTitulo: string) => void;
}

function ItemCard({ item, esAdmin, subiendoPortadaId, onEliminar, onCambiarPortada, onEstado, onRating, onRenombrar }: CardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [tituloEdit, setTituloEdit] = useState('');
  const tituloRef = useRef<HTMLInputElement>(null);

  function iniciarEditTitulo() {
    setTituloEdit(item.titulo);
    setEditandoTitulo(true);
    setTimeout(() => tituloRef.current?.select(), 0);
  }

  function confirmarTitulo() {
    const nuevo = tituloEdit.trim();
    if (nuevo && nuevo !== item.titulo) onRenombrar(item, nuevo);
    setEditandoTitulo(false);
  }

  return (
    <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden flex flex-col group transition-colors">
      {/* Portada */}
      <div className="relative" style={{ aspectRatio: '2/3' }}>
        {item.url_portada ? (
          <img src={item.url_portada} alt={item.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/60 gap-2">
            <span className="text-4xl opacity-20">{TIPOS.find(t => t.valor === item.tipo)?.emoji}</span>
            {esAdmin && (
              <span className="text-[10px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity text-center px-2 leading-relaxed">
                Clic para<br />agregar portada
              </span>
            )}
          </div>
        )}

        {esAdmin && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={subiendoPortadaId === item.id}
              className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer ${item.url_portada ? 'opacity-0 group-hover:opacity-100 bg-gray-950/55' : 'opacity-0 group-hover:opacity-100'}`}
              title={item.url_portada ? 'Cambiar portada' : 'Agregar portada'}
            >
              {subiendoPortadaId === item.id
                ? <span className="text-[11px] text-gray-200 bg-gray-950/80 px-2 py-1 rounded-lg">Subiendo...</span>
                : <Icon.Pencil className="w-5 h-5 text-white drop-shadow-lg" />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) onCambiarPortada(item.id, f, item.tipo); e.target.value = ''; }} />
          </>
        )}

        {esAdmin && (
          <button onClick={() => onEliminar(item)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 bg-gray-950/80 hover:bg-rose-950 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Eliminar">
            <Icon.Trash className="w-3.5 h-3.5" />
          </button>
        )}

        {item.plataforma && (
          <span className={`absolute bottom-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border backdrop-blur-sm ${plataformaCls(item.plataforma)}`}>
            {item.plataforma}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        {editandoTitulo ? (
          <input
            ref={tituloRef}
            className="w-full bg-gray-800 border border-emerald-700 rounded px-1.5 py-0.5 text-xs font-semibold text-gray-100 outline-none"
            value={tituloEdit}
            onChange={e => setTituloEdit(e.target.value)}
            onBlur={confirmarTitulo}
            onKeyDown={e => { if (e.key === 'Enter') confirmarTitulo(); if (e.key === 'Escape') setEditandoTitulo(false); }}
            autoFocus
          />
        ) : (
          <div
            className={`text-xs font-semibold text-gray-100 leading-snug line-clamp-2 ${esAdmin ? 'cursor-text hover:text-emerald-300 transition-colors' : ''}`}
            onClick={esAdmin ? iniciarEditTitulo : undefined}
            title={esAdmin ? 'Clic para editar título' : undefined}
          >
            {item.titulo}
          </div>
        )}

        <div className="flex items-center justify-between gap-1 flex-wrap">
          <Estrellas rating={item.rating} onChange={esAdmin ? v => onRating(item, v) : undefined} />
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${estadoCls(item.estado)}`}>
            {estadoLabel(item.estado)}
          </span>
        </div>

        {item.fecha_finalizado && (
          <p className="text-[10px] text-gray-700">
            ✓ {new Date(item.fecha_finalizado + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}

        {esAdmin && (
          <div className="flex gap-1 flex-wrap pt-1.5 border-t border-gray-800/60 mt-auto">
            {ESTADOS.map(s => (
              <button key={s.valor} onClick={() => onEstado(item, s.valor)}
                className={`text-[9px] px-1.5 py-0.5 rounded border cursor-pointer transition-all font-medium flex-1 min-w-0 text-center ${item.estado === s.valor ? s.cls : 'bg-transparent border-gray-800 text-gray-700 hover:border-gray-700 hover:text-gray-500'}`}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SeccionProps {
  tipo: typeof TIPOS[number];
  items: EntretenimientoItem[];
  cardProps: Omit<CardProps, 'item'>;
}

function Seccion({ tipo, items, cardProps }: SeccionProps) {
  if (items.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-lg leading-none">{tipo.emoji}</span>
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400">{tipo.label}</span>
        <span className="text-[11px] text-gray-700">· {items.length}</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map(item => <ItemCard key={item.id} item={item} {...cardProps} />)}
      </div>
    </div>
  );
}

/* ── Componente principal ───────────────────────────────── */
const FORM0 = { titulo: '', tipo: 'pelicula' as TipoEntretenimiento, estado: 'quiero' as EstadoEntretenimiento, rating: null as number | null, notas: '', plataforma: '' };

export function Entretenimiento() {
  const { puedeEditar } = useAuth();
  const esAdmin = puedeEditar('entretenimiento');

  const [items, setItems]             = useState<EntretenimientoItem[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [estadoF, setEstadoF]         = useState<EstadoEntretenimiento | 'todos'>('todos');
  const [orden, setOrden]             = useState<Orden>('reciente');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm]               = useState(FORM0);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const portadaRef                    = useRef<HTMLInputElement>(null);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [confirm, setConfirm]         = useState<EntretenimientoItem | null>(null);
  const [subiendoPortadaId, setSubiendoPortadaId] = useState<string | null>(null);

  async function cargar() {
    const { data } = await supabase.from('entretenimiento').select('*').order('creado_en', { ascending: false });
    setItems((data as EntretenimientoItem[]) ?? []);
    setCargando(false);
  }
  useEffect(() => { cargar(); }, []);

  function filtrarYOrdenar(lista: EntretenimientoItem[]) {
    let r = estadoF === 'todos' ? lista : lista.filter(i => i.estado === estadoF);
    if (orden === 'rating')  r = [...r].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (orden === 'alfa')    r = [...r].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    return r;
  }
  const filtrados = filtrarYOrdenar(items);

  async function guardar() {
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return; }
    setGuardando(true); setError(null);
    const { data: nuevo, error: err } = await supabase.from('entretenimiento').insert({
      titulo: form.titulo.trim(), tipo: form.tipo, estado: form.estado,
      rating: form.rating, notas: form.notas.trim() || null,
      plataforma: form.plataforma || null,
      fecha_finalizado: form.estado === 'visto' ? new Date().toISOString().slice(0, 10) : null,
    }).select().single();
    if (err) { setError(err.message); setGuardando(false); return; }
    if (portadaFile && nuevo) await subirPortada(nuevo.id, portadaFile, form.tipo);
    setForm(FORM0); setPortadaFile(null); setMostrarForm(false);
    if (portadaRef.current) portadaRef.current.value = '';
    setGuardando(false);
    cargar();
  }

  async function subirPortada(itemId: string, file: File, tipo: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const fd = new FormData();
    fd.append('item_id', itemId);
    fd.append('portada', file);
    fd.append('tipo', tipo);
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subir-portada-entretenimiento`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string },
      body: fd,
    });
  }

  async function cambiarPortadaCard(itemId: string, file: File, tipo: string) {
    setSubiendoPortadaId(itemId);
    await subirPortada(itemId, file, tipo);
    setSubiendoPortadaId(null);
    cargar();
  }

  async function actualizarEstado(item: EntretenimientoItem, estado: EstadoEntretenimiento) {
    const fecha_finalizado = estado === 'visto' && !item.fecha_finalizado
      ? new Date().toISOString().slice(0, 10) : item.fecha_finalizado;
    await supabase.from('entretenimiento').update({ estado, fecha_finalizado }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, estado, fecha_finalizado } : i));
  }

  async function actualizarRating(item: EntretenimientoItem, rating: number) {
    await supabase.from('entretenimiento').update({ rating }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, rating } : i));
  }

  async function actualizarTitulo(item: EntretenimientoItem, titulo: string) {
    await supabase.from('entretenimiento').update({ titulo }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, titulo } : i));
  }

  async function eliminar() {
    if (!confirm) return;
    if (confirm.drive_file_id) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eliminar-portada-entretenimiento`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string, 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: confirm.id }),
        }).catch(() => {});
      }
    }
    await supabase.from('entretenimiento').delete().eq('id', confirm.id);
    setConfirm(null);
    cargar();
  }

  const stats = TIPOS.map(t => ({ ...t, count: items.filter(i => i.tipo === t.valor).length }));

  const cardProps: Omit<CardProps, 'item'> = {
    esAdmin, subiendoPortadaId,
    onEliminar: setConfirm,
    onCambiarPortada: (id, file, tipo) => cambiarPortadaCard(id, file, tipo),
    onEstado: actualizarEstado,
    onRating: actualizarRating,
    onRenombrar: actualizarTitulo,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader
        num="06 / ENTRETENIMIENTO"
        title="Entretenimiento Favorito"
        sub="Películas, series y juegos que me gustan"
        actions={esAdmin && (
          <Btn variant="primary" size="sm" onClick={() => { setMostrarForm(f => !f); setError(null); }}>
            {mostrarForm ? 'Cancelar' : '+ Agregar'}
          </Btn>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.map(s => <StatTile key={s.valor} label={`${s.emoji} ${s.label}`} value={s.count} />)}
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-8 flex flex-col gap-4 max-w-lg">
          <Field label="Título">
            <input className={inputCls} placeholder="Nombre..." value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} autoFocus />
          </Field>
          <Field label="Tipo">
            <div className="flex gap-2">
              {TIPOS.map(t => (
                <button key={t.valor} type="button" onClick={() => setForm({ ...form, tipo: t.valor, plataforma: '' })}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border cursor-pointer transition-all ${form.tipo === t.valor ? 'bg-emerald-500 border-emerald-500 text-gray-950' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                  {t.emoji} {t.valor === 'pelicula' ? 'Película' : t.valor === 'serie' ? 'Serie' : 'Juego'}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plataforma">
              <select className={selectCls} value={form.plataforma} onChange={e => setForm({ ...form, plataforma: e.target.value })}>
                <option value="">Sin especificar</option>
                {PLATAFORMAS[form.tipo].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select className={selectCls} value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as EstadoEntretenimiento })}>
                {ESTADOS.map(s => <option key={s.valor} value={s.valor}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Rating">
            <Estrellas rating={form.rating} onChange={v => setForm({ ...form, rating: v })} />
          </Field>
          <Field label="Notas (opcional)">
            <textarea className={textareaCls} rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
          </Field>
          <Field label="Portada (opcional)">
            <div className="flex items-center gap-2">
              <Btn variant="ghost" size="sm" type="button" onClick={() => portadaRef.current?.click()}>
                {portadaFile ? `📎 ${portadaFile.name}` : 'Seleccionar imagen'}
              </Btn>
              {portadaFile && (
                <button onClick={() => { setPortadaFile(null); if (portadaRef.current) portadaRef.current.value = ''; }}
                  className="text-gray-600 hover:text-gray-400 cursor-pointer">
                  <Icon.X className="w-4 h-4" />
                </button>
              )}
              <input ref={portadaRef} type="file" accept="image/*" hidden onChange={e => setPortadaFile(e.target.files?.[0] ?? null)} />
            </div>
          </Field>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <Btn variant="primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      )}

      {/* Filtros y orden */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-1.5 flex-wrap">
          {(['todos', ...ESTADOS.map(s => s.valor)] as const).map(v => (
            <button key={v} onClick={() => setEstadoF(v as typeof estadoF)}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all font-medium ${estadoF === v
                ? v === 'todos' ? 'bg-gray-600 border-gray-600 text-gray-100' : estadoCls(v as EstadoEntretenimiento)
                : 'bg-transparent border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400'}`}>
              {v === 'todos' ? 'Todos' : estadoLabel(v as EstadoEntretenimiento)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-gray-700 uppercase tracking-wider hidden sm:block">Ordenar</span>
          {([['reciente', 'Reciente'], ['rating', 'Rating'], ['alfa', 'A–Z']] as [Orden, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setOrden(v)}
              className={`text-xs px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${orden === v ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-transparent border-gray-800 text-gray-600 hover:text-gray-400'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {cargando ? (
        <p className="text-sm text-gray-600">Cargando...</p>
      ) : filtrados.length === 0 ? (
        <EmptyState message="No hay elementos con estos filtros." />
      ) : (
        TIPOS.map(tipo => (
          <Seccion key={tipo.valor} tipo={tipo} items={filtrados.filter(i => i.tipo === tipo.valor)} cardProps={cardProps} />
        ))
      )}

      <ConfirmDialog
        open={!!confirm}
        title={`Eliminar "${confirm?.titulo}"`}
        message="Se eliminará este ítem y su portada de Drive permanentemente."
        onConfirm={eliminar}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
