import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { EntretenimientoItem, TipoEntretenimiento, EstadoEntretenimiento } from '../types';
import { PageHeader, Btn, Field, EmptyState, Badge } from '../components/UI';

const TIPOS: { valor: TipoEntretenimiento; label: string; emoji: string }[] = [
  { valor: 'pelicula', label: 'Película', emoji: '🎬' },
  { valor: 'serie',    label: 'Serie',    emoji: '📺' },
  { valor: 'juego',    label: 'Juego',    emoji: '🎮' },
];

const ESTADOS: { valor: EstadoEntretenimiento; label: string; badge: 'neutral' | 'warning' | 'success' }[] = [
  { valor: 'quiero',      label: 'Lo quiero',    badge: 'neutral' },
  { valor: 'en_progreso', label: 'En progreso',  badge: 'warning' },
  { valor: 'visto',       label: 'Visto/Jugado', badge: 'success' },
];

function labelEstado(estado: EstadoEntretenimiento) {
  return ESTADOS.find(e => e.valor === estado)?.label ?? estado;
}

function badgeEstado(estado: EstadoEntretenimiento) {
  return ESTADOS.find(e => e.valor === estado)?.badge ?? 'neutral';
}

function Estrellas({ rating, onChange }: { rating: number | null; onChange?: (v: number) => void }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`star${n <= (rating ?? 0) ? ' on' : ' off'}${!onChange ? ' readonly' : ''}`}
          onClick={() => onChange?.(n)}>★</span>
      ))}
    </div>
  );
}

const FORM0 = { titulo: '', tipo: 'pelicula' as TipoEntretenimiento, estado: 'quiero' as EstadoEntretenimiento, rating: null as number | null, notas: '' };

export function Entretenimiento() {
  const [items, setItems]           = useState<EntretenimientoItem[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<TipoEntretenimiento | 'todos'>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoEntretenimiento | 'todos'>('todos');
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [form, setForm]             = useState(FORM0);
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function cargar() {
    const { data } = await supabase.from('entretenimiento').select('*').order('creado_en', { ascending: false });
    setItems((data as EntretenimientoItem[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const filtrados = items.filter(i => {
    if (tipoFiltro !== 'todos' && i.tipo !== tipoFiltro) return false;
    if (estadoFiltro !== 'todos' && i.estado !== estadoFiltro) return false;
    return true;
  });

  async function guardar() {
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return; }
    setGuardando(true); setError(null);
    const { error: err } = await supabase.from('entretenimiento').insert({
      titulo: form.titulo.trim(), tipo: form.tipo, estado: form.estado,
      rating: form.rating, notas: form.notas.trim() || null,
    });
    setGuardando(false);
    if (err) { setError(err.message); return; }
    setForm(FORM0); setMostrarForm(false); cargar();
  }

  async function actualizarEstado(item: EntretenimientoItem, estado: EstadoEntretenimiento) {
    await supabase.from('entretenimiento').update({ estado }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, estado } : i));
  }

  async function actualizarRating(item: EntretenimientoItem, rating: number) {
    await supabase.from('entretenimiento').update({ rating }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, rating } : i));
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este elemento?')) return;
    await supabase.from('entretenimiento').delete().eq('id', id);
    setItems(p => p.filter(i => i.id !== id));
  }

  return (
    <div className="page page-wide">
      <PageHeader
        num="06 / ENTRETENIMIENTO"
        title="Entretenimiento"
        sub="Películas, series y juegos"
        actions={
          <Btn variant="primary" size="sm" onClick={() => { setMostrarForm(f => !f); setError(null); }}>
            {mostrarForm ? 'Cancelar' : '+ Agregar'}
          </Btn>
        }
      />

      {/* Formulario */}
      {mostrarForm && (
        <div className="card mb-lg flex-col gap-md" style={{ maxWidth: 480 }}>
          <Field label="Título">
            <input className="input" placeholder="Nombre de la película, serie o juego"
              value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
          </Field>

          <Field label="Tipo">
            <div className="flex gap-xs">
              {TIPOS.map(t => (
                <button key={t.valor} type="button"
                  className={`btn btn-ghost btn-sm flex-1${form.tipo === t.valor ? ' btn-primary' : ''}`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => setForm({ ...form, tipo: t.valor })}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Estado">
            <div className="flex gap-xs flex-wrap">
              {ESTADOS.map(s => (
                <button key={s.valor} type="button"
                  className={`btn btn-ghost btn-sm${form.estado === s.valor ? ' btn-primary' : ''}`}
                  onClick={() => setForm({ ...form, estado: s.valor })}>
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Rating">
            <Estrellas rating={form.rating} onChange={v => setForm({ ...form, rating: v })} />
          </Field>

          <Field label="Notas (opcional)">
            <textarea className="textarea-input" rows={2} value={form.notas}
              onChange={e => setForm({ ...form, notas: e.target.value })} />
          </Field>

          {error && <p className="text-sm text-error">{error}</p>}
          <Btn variant="primary" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Btn>
        </div>
      )}

      {/* Filtros */}
      <div className="flex-col gap-sm mb-lg">
        <div className="pill-tabs">
          <button className={`pill-tab${tipoFiltro === 'todos' ? ' active' : ''}`} onClick={() => setTipoFiltro('todos')}>
            Todos
          </button>
          {TIPOS.map(t => (
            <button key={t.valor} className={`pill-tab${tipoFiltro === t.valor ? ' active' : ''}`}
              onClick={() => setTipoFiltro(t.valor)}>
              {t.emoji} {t.label}s
            </button>
          ))}
        </div>

        <div className="pill-tabs">
          <button className={`pill-tab${estadoFiltro === 'todos' ? ' active' : ''}`} onClick={() => setEstadoFiltro('todos')}>
            Todos
          </button>
          {ESTADOS.map(s => (
            <button key={s.valor} className={`pill-tab${estadoFiltro === s.valor ? ' active' : ''}`}
              onClick={() => setEstadoFiltro(s.valor)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {cargando && <p className="text-sm text-2">Cargando...</p>}
      {!cargando && filtrados.length === 0 && <EmptyState message="No hay elementos con estos filtros." />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
        {filtrados.map(item => {
          const tipoInfo = TIPOS.find(t => t.valor === item.tipo)!;
          return (
            <div key={item.id} className="entret-card">
              <div className="flex justify-between items-start">
                <span className="text-xs text-2">{tipoInfo.emoji} {tipoInfo.label}</span>
                <div className="flex items-center gap-xs">
                  <Badge variant={badgeEstado(item.estado)}>{labelEstado(item.estado)}</Badge>
                  <Btn variant="danger" size="sm" onClick={() => eliminar(item.id)}>✕</Btn>
                </div>
              </div>

              <div className="font-600 text-md" style={{ lineHeight: 1.3 }}>{item.titulo}</div>

              <Estrellas rating={item.rating} onChange={v => actualizarRating(item, v)} />

              {item.notas && <div className="text-sm text-2">{item.notas}</div>}

              <div className="flex gap-xs flex-wrap mt-xs">
                {ESTADOS.map(s => (
                  <button key={s.valor}
                    className={`pill-tab btn-sm${item.estado === s.valor ? ' active' : ''}`}
                    style={{ fontSize: '11px', padding: '0.2rem 0.55rem' }}
                    onClick={() => actualizarEstado(item, s.valor)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
