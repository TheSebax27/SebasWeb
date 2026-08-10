import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { EntretenimientoItem, TipoEntretenimiento, EstadoEntretenimiento } from '../types';

const TIPOS: { valor: TipoEntretenimiento; label: string; emoji: string }[] = [
  { valor: 'pelicula', label: 'Película', emoji: '🎬' },
  { valor: 'serie',    label: 'Serie',    emoji: '📺' },
  { valor: 'juego',    label: 'Juego',    emoji: '🎮' },
];

const ESTADOS: { valor: EstadoEntretenimiento; label: string; color: string }[] = [
  { valor: 'quiero',      label: 'Lo quiero',   color: '#e8f0fe' },
  { valor: 'en_progreso', label: 'En progreso', color: '#fff4e5' },
  { valor: 'visto',       label: 'Visto/Jugado', color: '#e6f4ea' },
];

function colorEstado(estado: EstadoEntretenimiento) {
  return ESTADOS.find((e) => e.valor === estado)?.color ?? '#f5f5f5';
}

function labelEstado(estado: EstadoEntretenimiento) {
  return ESTADOS.find((e) => e.valor === estado)?.label ?? estado;
}

function Estrellas({ rating, onChange }: { rating: number | null; onChange?: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          style={{
            fontSize: '1.1rem',
            cursor: onChange ? 'pointer' : 'default',
            color: n <= (rating ?? 0) ? '#f59e0b' : '#d1d5db',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

const FORM_VACIO = {
  titulo: '',
  tipo: 'pelicula' as TipoEntretenimiento,
  estado: 'quiero' as EstadoEntretenimiento,
  rating: null as number | null,
  notas: '',
};

export function Entretenimiento() {
  const [items, setItems] = useState<EntretenimientoItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<TipoEntretenimiento | 'todos'>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoEntretenimiento | 'todos'>('todos');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const { data } = await supabase
      .from('entretenimiento')
      .select('*')
      .order('creado_en', { ascending: false });
    setItems((data as EntretenimientoItem[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const filtrados = items.filter((i) => {
    if (tipoFiltro !== 'todos' && i.tipo !== tipoFiltro) return false;
    if (estadoFiltro !== 'todos' && i.estado !== estadoFiltro) return false;
    return true;
  });

  async function guardar() {
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return; }
    setGuardando(true);
    setError(null);
    const { error: err } = await supabase.from('entretenimiento').insert({
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      estado: form.estado,
      rating: form.rating,
      notas: form.notas.trim() || null,
    });
    setGuardando(false);
    if (err) { setError(err.message); return; }
    setForm(FORM_VACIO);
    setMostrarForm(false);
    cargar();
  }

  async function actualizarEstado(item: EntretenimientoItem, estado: EstadoEntretenimiento) {
    await supabase.from('entretenimiento').update({ estado }).eq('id', item.id);
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, estado } : i));
  }

  async function actualizarRating(item: EntretenimientoItem, rating: number) {
    await supabase.from('entretenimiento').update({ rating }).eq('id', item.id);
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, rating } : i));
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este elemento?')) return;
    await supabase.from('entretenimiento').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (cargando) return <p style={{ padding: '1rem' }}>Cargando...</p>;

  return (
    <div style={{ padding: '1rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Entretenimiento</h1>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setError(null); }}
          style={{ padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}
        >
          {mostrarForm ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: 480 }}>
          <input
            placeholder="Título *"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
          />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setForm({ ...form, tipo: t.valor })}
                style={{
                  flex: 1, padding: '0.4rem', borderRadius: 6, cursor: 'pointer', border: '1px solid #ccc',
                  background: form.tipo === t.valor ? '#e8f0fe' : 'transparent',
                  fontWeight: form.tipo === t.valor ? 600 : 400,
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {ESTADOS.map((s) => (
              <button
                key={s.valor}
                type="button"
                onClick={() => setForm({ ...form, estado: s.valor })}
                style={{
                  flex: 1, padding: '0.4rem', borderRadius: 6, cursor: 'pointer', border: '1px solid #ccc',
                  background: form.estado === s.valor ? s.color : 'transparent',
                  fontWeight: form.estado === s.valor ? 600 : 400,
                  fontSize: '0.8rem',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', color: '#555' }}>Rating: </span>
            <Estrellas rating={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          </div>

          <textarea
            placeholder="Notas (opcional)"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            rows={2}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
          />

          {error && <p style={{ color: 'crimson', margin: 0, fontSize: '0.85rem' }}>{error}</p>}

          <button
            onClick={guardar}
            disabled={guardando}
            style={{ padding: '0.5rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Filtros por tipo */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {[{ valor: 'todos', label: 'Todos' }, ...TIPOS.map((t) => ({ valor: t.valor, label: `${t.emoji} ${t.label}s` }))].map((f) => (
          <button
            key={f.valor}
            onClick={() => setTipoFiltro(f.valor as typeof tipoFiltro)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: 20, cursor: 'pointer', border: '1px solid #ddd',
              background: tipoFiltro === f.valor ? '#1a73e8' : 'transparent',
              color: tipoFiltro === f.valor ? '#fff' : 'inherit',
              fontSize: '0.85rem',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtros por estado */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[{ valor: 'todos', label: 'Todos', color: '#f5f5f5' }, ...ESTADOS].map((f) => (
          <button
            key={f.valor}
            onClick={() => setEstadoFiltro(f.valor as typeof estadoFiltro)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${estadoFiltro === f.valor ? '#1a73e8' : '#ddd'}`,
              background: estadoFiltro === f.valor ? f.color : 'transparent',
              fontWeight: estadoFiltro === f.valor ? 600 : 400,
              fontSize: '0.85rem',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 && (
        <p style={{ color: '#888' }}>No hay elementos con estos filtros.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
        {filtrados.map((item) => {
          const tipoInfo = TIPOS.find((t) => t.valor === item.tipo)!;
          return (
            <div
              key={item.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                padding: '0.85rem',
                background: colorEstado(item.estado),
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                  {tipoInfo.emoji} {tipoInfo.label}
                </span>
                <button
                  onClick={() => eliminar(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.9rem', padding: 0 }}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>

              <strong style={{ fontSize: '1rem', lineHeight: 1.3 }}>{item.titulo}</strong>

              <Estrellas rating={item.rating} onChange={(v) => actualizarRating(item, v)} />

              {item.notas && (
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#555' }}>{item.notas}</p>
              )}

              {/* Selector de estado */}
              <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                {ESTADOS.map((s) => (
                  <button
                    key={s.valor}
                    onClick={() => actualizarEstado(item, s.valor)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      border: `1px solid ${item.estado === s.valor ? '#1a73e8' : '#ccc'}`,
                      background: item.estado === s.valor ? '#1a73e8' : 'transparent',
                      color: item.estado === s.valor ? '#fff' : 'inherit',
                      fontWeight: item.estado === s.valor ? 600 : 400,
                    }}
                  >
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
