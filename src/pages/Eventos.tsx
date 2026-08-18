import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Concierto, Partido, EstadoAsistencia } from '../types';
import { PageHeader, Btn, Field, EmptyState, ConfirmDialog, StatTile, Icon, inputCls, textareaCls } from '../components/UI';

type TabEventos = 'conciertos' | 'partidos';
type TablaEvento = 'conciertos' | 'partidos';

function fmtFecha(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function asistenciaBadge(estado: EstadoAsistencia) {
  return estado === 'fui'
    ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-900">✓ Fui</span>
    : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-900">⭐ Quiero ir</span>;
}

/* ── Miniatura con upload ───────────────────────────────── */
function FotoEvento({ url, esAdmin, subiendo, onFile, emoji }: {
  url: string | null;
  esAdmin: boolean;
  subiendo: boolean;
  onFile: (f: File) => void;
  emoji: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative shrink-0 group/foto">
      <div
        className="w-14 h-14 rounded-xl overflow-hidden border border-gray-700 bg-gray-900 flex items-center justify-center cursor-pointer"
        onClick={esAdmin ? () => ref.current?.click() : undefined}
        title={esAdmin ? (url ? 'Cambiar foto' : 'Agregar foto') : undefined}
      >
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-40">{emoji}</span>
        )}
        {esAdmin && !subiendo && (
          <div className="absolute inset-0 rounded-xl bg-gray-950/60 flex items-center justify-center opacity-0 group-hover/foto:opacity-100 transition-opacity">
            <Icon.Pencil className="w-4 h-4 text-white drop-shadow" />
          </div>
        )}
        {subiendo && (
          <div className="absolute inset-0 rounded-xl bg-gray-950/70 flex items-center justify-center">
            <span className="text-[9px] text-gray-300">...</span>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
  );
}

/* ── Tarjeta Concierto ─────────────────────────────────── */
function ConciertoCard({ c, esAdmin, subiendoId, onEliminar, onToggleEstado, onFoto }: {
  c: Concierto; esAdmin: boolean; subiendoId: string | null;
  onEliminar: (c: Concierto) => void;
  onToggleEstado: (c: Concierto) => void;
  onFoto: (c: Concierto, f: File) => void;
}) {
  return (
    <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex gap-3 transition-colors group">
      <FotoEvento
        url={c.url_portada}
        esAdmin={esAdmin}
        subiendo={subiendoId === c.id}
        onFile={f => onFoto(c, f)}
        emoji="🎵"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-100">{c.artista}</p>
            {c.tour_festival && <p className="text-xs text-violet-400">{c.tour_festival}</p>}
          </div>
          {asistenciaBadge(c.estado)}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {(c.lugar || c.ciudad) && (
            <span className="text-[11px] text-gray-500">
              📍 {[c.lugar, c.ciudad].filter(Boolean).join(', ')}
            </span>
          )}
          {c.fecha && <span className="text-[11px] text-gray-500">📅 {fmtFecha(c.fecha)}</span>}
        </div>
        {c.notas && <p className="mt-1 text-[11px] text-gray-600 italic line-clamp-2">{c.notas}</p>}
      </div>
      {esAdmin && (
        <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onToggleEstado(c)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors cursor-pointer"
            title={c.estado === 'fui' ? 'Marcar como quiero ir' : 'Marcar como fui'}>
            {c.estado === 'fui' ? '↩' : '✓'}
          </button>
          <button onClick={() => onEliminar(c)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer">
            <Icon.Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Tarjeta Partido ───────────────────────────────────── */
function PartidoCard({ p, esAdmin, subiendoId, onEliminar, onToggleEstado, onFoto }: {
  p: Partido; esAdmin: boolean; subiendoId: string | null;
  onEliminar: (p: Partido) => void;
  onToggleEstado: (p: Partido) => void;
  onFoto: (p: Partido, f: File) => void;
}) {
  return (
    <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex gap-3 transition-colors group">
      <FotoEvento
        url={p.url_portada}
        esAdmin={esAdmin}
        subiendo={subiendoId === p.id}
        onFile={f => onFoto(p, f)}
        emoji="⚽"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-100 leading-snug">
              {p.equipo_local && p.equipo_visitante
                ? `${p.equipo_local} vs ${p.equipo_visitante}`
                : p.descripcion}
            </p>
            {p.competicion && <p className="text-xs text-emerald-400">{p.competicion}</p>}
          </div>
          {asistenciaBadge(p.estado)}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {(p.estadio || p.ciudad) && (
            <span className="text-[11px] text-gray-500">
              🏟️ {[p.estadio, p.ciudad].filter(Boolean).join(', ')}
            </span>
          )}
          {p.fecha && <span className="text-[11px] text-gray-500">📅 {fmtFecha(p.fecha)}</span>}
          {p.resultado && p.estado === 'fui' && (
            <span className="text-[11px] font-semibold text-amber-400">⚽ {p.resultado}</span>
          )}
        </div>
        {p.notas && <p className="mt-1 text-[11px] text-gray-600 italic line-clamp-2">{p.notas}</p>}
      </div>
      {esAdmin && (
        <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onToggleEstado(p)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors cursor-pointer"
            title={p.estado === 'fui' ? 'Marcar como quiero ir' : 'Marcar como fui'}>
            {p.estado === 'fui' ? '↩' : '✓'}
          </button>
          <button onClick={() => onEliminar(p)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer">
            <Icon.Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Form constants ─────────────────────────────────────── */
const CONCIERTO0 = { artista: '', tour_festival: '', lugar: '', ciudad: '', fecha: '', estado: 'quiero_ir' as EstadoAsistencia, notas: '' };
const PARTIDO0   = { descripcion: '', equipo_local: '', equipo_visitante: '', competicion: '', estadio: '', ciudad: '', fecha: '', resultado: '', estado: 'quiero_ir' as EstadoAsistencia, notas: '' };

/* ── Componente principal ───────────────────────────────── */
export function Eventos() {
  const { puedeEditar } = useAuth();
  const esAdmin = puedeEditar('eventos');
  const [tab, setTab] = useState<TabEventos>('conciertos');

  /* ── Conciertos ── */
  const [conciertos,     setConciertos]     = useState<Concierto[]>([]);
  const [cargC,          setCargC]          = useState(true);
  const [showFormC,      setShowFormC]      = useState(false);
  const [formC,          setFormC]          = useState(CONCIERTO0);
  const [guardandoC,     setGuardandoC]     = useState(false);
  const [errC,           setErrC]           = useState<string | null>(null);
  const [confirmC,       setConfirmC]       = useState<Concierto | null>(null);
  const [filtroC,        setFiltroC]        = useState<EstadoAsistencia | 'todos'>('todos');
  const [subiendoFC,     setSubiendoFC]     = useState<string | null>(null);

  /* ── Partidos ── */
  const [partidos,       setPartidos]       = useState<Partido[]>([]);
  const [cargP,          setCargP]          = useState(true);
  const [showFormP,      setShowFormP]      = useState(false);
  const [formP,          setFormP]          = useState(PARTIDO0);
  const [guardandoP,     setGuardandoP]     = useState(false);
  const [errP,           setErrP]           = useState<string | null>(null);
  const [confirmP,       setConfirmP]       = useState<Partido | null>(null);
  const [filtroP,        setFiltroP]        = useState<EstadoAsistencia | 'todos'>('todos');
  const [subiendoFP,     setSubiendoFP]     = useState<string | null>(null);

  async function cargarConciertos() {
    const { data } = await supabase.from('conciertos').select('*').order('fecha', { ascending: false, nullsFirst: false });
    setConciertos((data as Concierto[]) ?? []); setCargC(false);
  }
  async function cargarPartidos() {
    const { data } = await supabase.from('partidos').select('*').order('fecha', { ascending: false, nullsFirst: false });
    setPartidos((data as Partido[]) ?? []); setCargP(false);
  }

  useEffect(() => { cargarConciertos(); cargarPartidos(); }, []);

  /* ── Helpers Drive ── */
  async function subirFotoEvento(itemId: string, tabla: TablaEvento, file: File) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const fd = new FormData();
    fd.append('item_id', itemId);
    fd.append('tabla', tabla);
    fd.append('foto', file);
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subir-foto-evento`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string },
      body: fd,
    });
  }

  async function eliminarFotoEvento(itemId: string, tabla: TablaEvento) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eliminar-foto-evento`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string, 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, tabla }),
    }).catch(() => {});
  }

  /* ── CRUD Conciertos ── */
  async function guardarConcierto() {
    if (!formC.artista.trim()) { setErrC('El artista es obligatorio'); return; }
    setGuardandoC(true); setErrC(null);
    const { error } = await supabase.from('conciertos').insert({
      artista: formC.artista.trim(),
      tour_festival: formC.tour_festival.trim() || null,
      lugar: formC.lugar.trim() || null,
      ciudad: formC.ciudad.trim() || null,
      fecha: formC.fecha || null,
      estado: formC.estado,
      notas: formC.notas.trim() || null,
    });
    setGuardandoC(false);
    if (error) { setErrC(error.message); return; }
    setFormC(CONCIERTO0); setShowFormC(false); cargarConciertos();
  }

  async function toggleEstadoConcierto(c: Concierto) {
    const nuevo: EstadoAsistencia = c.estado === 'fui' ? 'quiero_ir' : 'fui';
    await supabase.from('conciertos').update({ estado: nuevo }).eq('id', c.id);
    setConciertos(p => p.map(x => x.id === c.id ? { ...x, estado: nuevo } : x));
  }

  async function cambiarFotoConcierto(c: Concierto, file: File) {
    setSubiendoFC(c.id);
    await subirFotoEvento(c.id, 'conciertos', file);
    setSubiendoFC(null);
    cargarConciertos();
  }

  async function eliminarConcierto() {
    if (!confirmC) return;
    if (confirmC.drive_file_id) await eliminarFotoEvento(confirmC.id, 'conciertos');
    await supabase.from('conciertos').delete().eq('id', confirmC.id);
    setConfirmC(null); cargarConciertos();
  }

  /* ── CRUD Partidos ── */
  async function guardarPartido() {
    if (!formP.descripcion.trim() && !formP.equipo_local.trim()) { setErrP('El nombre o los equipos son obligatorios'); return; }
    setGuardandoP(true); setErrP(null);
    const desc = formP.equipo_local.trim() && formP.equipo_visitante.trim()
      ? `${formP.equipo_local.trim()} vs ${formP.equipo_visitante.trim()}`
      : formP.descripcion.trim() || `${formP.equipo_local.trim()} vs ...`;
    const { error } = await supabase.from('partidos').insert({
      descripcion: desc,
      equipo_local: formP.equipo_local.trim() || null,
      equipo_visitante: formP.equipo_visitante.trim() || null,
      competicion: formP.competicion.trim() || null,
      estadio: formP.estadio.trim() || null,
      ciudad: formP.ciudad.trim() || null,
      fecha: formP.fecha || null,
      resultado: formP.resultado.trim() || null,
      estado: formP.estado,
      notas: formP.notas.trim() || null,
    });
    setGuardandoP(false);
    if (error) { setErrP(error.message); return; }
    setFormP(PARTIDO0); setShowFormP(false); cargarPartidos();
  }

  async function toggleEstadoPartido(p: Partido) {
    const nuevo: EstadoAsistencia = p.estado === 'fui' ? 'quiero_ir' : 'fui';
    await supabase.from('partidos').update({ estado: nuevo }).eq('id', p.id);
    setPartidos(prev => prev.map(x => x.id === p.id ? { ...x, estado: nuevo } : x));
  }

  async function cambiarFotoPartido(p: Partido, file: File) {
    setSubiendoFP(p.id);
    await subirFotoEvento(p.id, 'partidos', file);
    setSubiendoFP(null);
    cargarPartidos();
  }

  async function eliminarPartido() {
    if (!confirmP) return;
    if (confirmP.drive_file_id) await eliminarFotoEvento(confirmP.id, 'partidos');
    await supabase.from('partidos').delete().eq('id', confirmP.id);
    setConfirmP(null); cargarPartidos();
  }

  const conciertosFiltrados = filtroC === 'todos' ? conciertos : conciertos.filter(c => c.estado === filtroC);
  const partidosFiltrados   = filtroP === 'todos' ? partidos   : partidos.filter(p => p.estado === filtroP);

  function FiltroBadge({ valor, actual, onSet }: { valor: EstadoAsistencia | 'todos'; actual: EstadoAsistencia | 'todos'; onSet: () => void }) {
    const activo = valor === actual;
    const cls = activo
      ? valor === 'todos'      ? 'bg-gray-600 border-gray-600 text-gray-100'
      : valor === 'fui'        ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
      : 'bg-amber-950 text-amber-400 border-amber-900'
      : 'bg-transparent border-gray-800 text-gray-600 hover:text-gray-400';
    const label = valor === 'todos' ? 'Todos' : valor === 'fui' ? '✓ Fui' : '⭐ Quiero ir';
    return (
      <button onClick={onSet} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all font-medium ${cls}`}>
        {label}
      </button>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader
        num="07 / EVENTOS"
        title="Eventos"
        sub="Conciertos y partidos — los que fui y los que quiero ir"
        actions={esAdmin && (
          tab === 'conciertos'
            ? <Btn variant="primary" size="sm" onClick={() => { setShowFormC(f => !f); setErrC(null); }}>{showFormC ? 'Cancelar' : '+ Agregar concierto'}</Btn>
            : <Btn variant="primary" size="sm" onClick={() => { setShowFormP(f => !f); setErrP(null); }}>{showFormP ? 'Cancelar' : '+ Agregar partido'}</Btn>
        )}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900/50 p-1 rounded-xl border border-gray-800 mb-6">
        {([
          { key: 'conciertos', label: '🎵 Conciertos', badge: conciertos.filter(c=>c.estado==='quiero_ir').length },
          { key: 'partidos',   label: '⚽ Partidos',   badge: partidos.filter(p=>p.estado==='quiero_ir').length },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${tab === t.key ? 'bg-gray-800 text-gray-100 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-gray-950 text-[9px] font-bold">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB CONCIERTOS ══ */}
      {tab === 'conciertos' && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatTile label="Total" value={conciertos.length} />
            <StatTile label="✓ Fui" value={conciertos.filter(c=>c.estado==='fui').length} />
            <StatTile label="⭐ Quiero ir" value={conciertos.filter(c=>c.estado==='quiero_ir').length} />
          </div>

          {showFormC && (
            <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4 max-w-lg">
              <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-700">
                {(['fui', 'quiero_ir'] as EstadoAsistencia[]).map(s => (
                  <button key={s} onClick={() => setFormC({ ...formC, estado: s })}
                    className={`py-2.5 text-sm font-medium cursor-pointer transition-colors ${formC.estado === s
                      ? s === 'fui' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>
                    {s === 'fui' ? '✓ Fui' : '⭐ Quiero ir'}
                  </button>
                ))}
              </div>
              <Field label="Artista / Cantante">
                <input className={inputCls} placeholder="Ej. Bad Bunny, Taylor Swift..." value={formC.artista} onChange={e => setFormC({ ...formC, artista: e.target.value })} autoFocus />
              </Field>
              <Field label="Tour / Festival (opcional)">
                <input className={inputCls} placeholder="Ej. Most Wanted Tour, Lollapalooza..." value={formC.tour_festival} onChange={e => setFormC({ ...formC, tour_festival: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Lugar / Recinto">
                  <input className={inputCls} placeholder="Estadio, teatro..." value={formC.lugar} onChange={e => setFormC({ ...formC, lugar: e.target.value })} />
                </Field>
                <Field label="Ciudad">
                  <input className={inputCls} placeholder="Bogotá, Madrid..." value={formC.ciudad} onChange={e => setFormC({ ...formC, ciudad: e.target.value })} />
                </Field>
              </div>
              <Field label="Fecha">
                <input className={inputCls} type="date" value={formC.fecha} onChange={e => setFormC({ ...formC, fecha: e.target.value })} />
              </Field>
              <Field label="Notas (opcional)">
                <textarea className={textareaCls} rows={2} value={formC.notas} onChange={e => setFormC({ ...formC, notas: e.target.value })} />
              </Field>
              {errC && <p className="text-xs text-rose-400">{errC}</p>}
              <Btn variant="primary" onClick={guardarConcierto} disabled={guardandoC}>{guardandoC ? 'Guardando...' : 'Registrar concierto'}</Btn>
            </div>
          )}

          <div className="flex gap-1.5 mb-5">
            {(['todos', 'fui', 'quiero_ir'] as const).map(v => (
              <FiltroBadge key={v} valor={v} actual={filtroC} onSet={() => setFiltroC(v)} />
            ))}
          </div>

          {cargC ? (
            <p className="text-sm text-gray-600">Cargando...</p>
          ) : conciertosFiltrados.length === 0 ? (
            <EmptyState message="No hay conciertos registrados." />
          ) : (
            <div className="flex flex-col gap-3">
              {conciertosFiltrados.map(c => (
                <ConciertoCard key={c.id} c={c} esAdmin={esAdmin}
                  subiendoId={subiendoFC}
                  onEliminar={setConfirmC}
                  onToggleEstado={toggleEstadoConcierto}
                  onFoto={cambiarFotoConcierto}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ TAB PARTIDOS ══ */}
      {tab === 'partidos' && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatTile label="Total" value={partidos.length} />
            <StatTile label="✓ Fui" value={partidos.filter(p=>p.estado==='fui').length} />
            <StatTile label="⭐ Quiero ir" value={partidos.filter(p=>p.estado==='quiero_ir').length} />
          </div>

          {showFormP && (
            <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4 max-w-lg">
              <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-700">
                {(['fui', 'quiero_ir'] as EstadoAsistencia[]).map(s => (
                  <button key={s} onClick={() => setFormP({ ...formP, estado: s })}
                    className={`py-2.5 text-sm font-medium cursor-pointer transition-colors ${formP.estado === s
                      ? s === 'fui' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>
                    {s === 'fui' ? '✓ Fui' : '⭐ Quiero ir'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Equipo local">
                  <input className={inputCls} placeholder="Real Madrid..." value={formP.equipo_local} onChange={e => setFormP({ ...formP, equipo_local: e.target.value })} autoFocus />
                </Field>
                <Field label="Equipo visitante">
                  <input className={inputCls} placeholder="Barcelona..." value={formP.equipo_visitante} onChange={e => setFormP({ ...formP, equipo_visitante: e.target.value })} />
                </Field>
              </div>
              <Field label="Descripción (si no hay equipos definidos)">
                <input className={inputCls} placeholder="Ej. Final Copa Libertadores 2024..." value={formP.descripcion} onChange={e => setFormP({ ...formP, descripcion: e.target.value })} />
              </Field>
              <Field label="Competición / torneo">
                <input className={inputCls} placeholder="La Liga, Champions, Copa..." value={formP.competicion} onChange={e => setFormP({ ...formP, competicion: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Estadio">
                  <input className={inputCls} placeholder="Bernabéu, Camp Nou..." value={formP.estadio} onChange={e => setFormP({ ...formP, estadio: e.target.value })} />
                </Field>
                <Field label="Ciudad">
                  <input className={inputCls} placeholder="Madrid, Barcelona..." value={formP.ciudad} onChange={e => setFormP({ ...formP, ciudad: e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha">
                  <input className={inputCls} type="date" value={formP.fecha} onChange={e => setFormP({ ...formP, fecha: e.target.value })} />
                </Field>
                <Field label="Resultado (si ya fue)">
                  <input className={inputCls} placeholder="2 - 1" value={formP.resultado} onChange={e => setFormP({ ...formP, resultado: e.target.value })} />
                </Field>
              </div>
              <Field label="Notas (opcional)">
                <textarea className={textareaCls} rows={2} value={formP.notas} onChange={e => setFormP({ ...formP, notas: e.target.value })} />
              </Field>
              {errP && <p className="text-xs text-rose-400">{errP}</p>}
              <Btn variant="primary" onClick={guardarPartido} disabled={guardandoP}>{guardandoP ? 'Guardando...' : 'Registrar partido'}</Btn>
            </div>
          )}

          <div className="flex gap-1.5 mb-5">
            {(['todos', 'fui', 'quiero_ir'] as const).map(v => (
              <FiltroBadge key={v} valor={v} actual={filtroP} onSet={() => setFiltroP(v)} />
            ))}
          </div>

          {cargP ? (
            <p className="text-sm text-gray-600">Cargando...</p>
          ) : partidosFiltrados.length === 0 ? (
            <EmptyState message="No hay partidos registrados." />
          ) : (
            <div className="flex flex-col gap-3">
              {partidosFiltrados.map(p => (
                <PartidoCard key={p.id} p={p} esAdmin={esAdmin}
                  subiendoId={subiendoFP}
                  onEliminar={setConfirmP}
                  onToggleEstado={toggleEstadoPartido}
                  onFoto={cambiarFotoPartido}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={!!confirmC}
        title={`Eliminar concierto de ${confirmC?.artista}`}
        message="Se eliminará este registro y su foto permanentemente."
        onConfirm={eliminarConcierto}
        onCancel={() => setConfirmC(null)}
      />
      <ConfirmDialog
        open={!!confirmP}
        title={`Eliminar partido "${confirmP?.descripcion}"`}
        message="Se eliminará este registro y su foto permanentemente."
        onConfirm={eliminarPartido}
        onCancel={() => setConfirmP(null)}
      />
    </div>
  );
}
