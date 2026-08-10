import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Meta } from '../types';

type Filtro = 'activas' | 'completadas' | 'todas';

const FORM_VACIO = {
  titulo: '',
  descripcion: '',
  valor_meta: '',
  fecha_limite: '',
};

function BarraProgreso({ actual, meta }: { actual: number; meta: number }) {
  const pct = Math.min(100, Math.round((actual / meta) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555', marginBottom: 4 }}>
        <span>{actual.toLocaleString('es')} / {meta.toLocaleString('es')}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 4,
          background: pct >= 100 ? '#16a34a' : '#1a73e8',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}

export function Metas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('activas');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  // Para actualizar progreso: { id, valor }
  const [progreso, setProgreso] = useState<Record<string, string>>({});

  async function cargar() {
    const { data } = await supabase
      .from('metas')
      .select('*')
      .order('creado_en', { ascending: false });
    setMetas((data as Meta[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const filtradas = metas.filter((m) => {
    if (filtro === 'activas') return !m.completada;
    if (filtro === 'completadas') return m.completada;
    return true;
  });

  const activas = metas.filter((m) => !m.completada).length;
  const completadas = metas.filter((m) => m.completada).length;

  async function guardar() {
    if (!form.titulo.trim()) { setErrorForm('El título es obligatorio'); return; }
    setGuardando(true);
    setErrorForm(null);

    const { error } = await supabase.from('metas').insert({
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      valor_meta: form.valor_meta ? parseFloat(form.valor_meta) : null,
      fecha_limite: form.fecha_limite || null,
    });

    setGuardando(false);
    if (error) { setErrorForm(error.message); return; }
    setForm(FORM_VACIO);
    setMostrarForm(false);
    cargar();
  }

  async function actualizarProgreso(meta: Meta) {
    const raw = progreso[meta.id];
    const valor = parseFloat(raw);
    if (isNaN(valor) || valor < 0) return;

    const nuevo = meta.valor_actual + valor;
    const { error } = await supabase
      .from('metas')
      .update({ valor_actual: nuevo })
      .eq('id', meta.id);

    if (!error) {
      setMetas((prev) => prev.map((m) => m.id === meta.id ? { ...m, valor_actual: nuevo } : m));
      setProgreso((prev) => ({ ...prev, [meta.id]: '' }));
    }
  }

  async function toggleCompletada(meta: Meta) {
    const nuevoEstado = !meta.completada;
    const { error } = await supabase
      .from('metas')
      .update({ completada: nuevoEstado })
      .eq('id', meta.id);

    if (!error) {
      setMetas((prev) => prev.map((m) => m.id === meta.id ? { ...m, completada: nuevoEstado } : m));
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta meta?')) return;
    await supabase.from('metas').delete().eq('id', id);
    setMetas((prev) => prev.filter((m) => m.id !== id));
  }

  function diasRestantes(fecha: string) {
    const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { texto: `Venció hace ${Math.abs(diff)}d`, color: '#dc2626' };
    if (diff === 0) return { texto: 'Vence hoy', color: '#d97706' };
    if (diff <= 7) return { texto: `${diff}d restantes`, color: '#d97706' };
    return { texto: `${diff}d restantes`, color: '#555' };
  }

  if (cargando) return <p style={{ padding: '1rem' }}>Cargando...</p>;

  return (
    <div style={{ padding: '1rem', maxWidth: 720, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Metas</h1>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setErrorForm(null); }}
          style={{ padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}
        >
          {mostrarForm ? 'Cancelar' : '+ Nueva meta'}
        </button>
      </div>

      {/* Resumen */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Activas', valor: activas, color: '#dbeafe' },
          { label: 'Completadas', valor: completadas, color: '#dcfce7' },
          { label: 'Total', valor: metas.length, color: '#f1f5f9' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: s.color, borderRadius: 8, padding: '0.6rem 0.85rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.valor}</div>
            <div style={{ fontSize: '0.8rem', color: '#555' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <input
            placeholder="Título de la meta *"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={2}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#666' }}>Valor objetivo (opcional)</label>
              <input
                type="number"
                placeholder="Ej: 5000"
                value={form.valor_meta}
                onChange={(e) => setForm({ ...form, valor_meta: e.target.value })}
                style={{ display: 'block', width: '100%', padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#666' }}>Fecha límite (opcional)</label>
              <input
                type="date"
                value={form.fecha_limite}
                onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
                style={{ display: 'block', width: '100%', padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          {errorForm && <p style={{ color: 'crimson', margin: 0, fontSize: '0.85rem' }}>{errorForm}</p>}
          <button
            onClick={guardar}
            disabled={guardando}
            style={{ padding: '0.5rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}
          >
            {guardando ? 'Guardando...' : 'Crear meta'}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {(['activas', 'completadas', 'todas'] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: 20, cursor: 'pointer', border: '1px solid #ddd',
              background: filtro === f ? '#1a73e8' : 'transparent',
              color: filtro === f ? '#fff' : 'inherit',
              textTransform: 'capitalize',
              fontSize: '0.85rem',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 && (
        <p style={{ color: '#888' }}>No hay metas {filtro === 'todas' ? '' : filtro} todavía.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtradas.map((meta) => (
          <div
            key={meta.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: '1rem',
              background: meta.completada ? '#f0fdf4' : '#fff',
              opacity: meta.completada ? 0.85 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1rem', textDecoration: meta.completada ? 'line-through' : 'none', color: meta.completada ? '#666' : 'inherit' }}>
                    {meta.titulo}
                  </strong>
                  {meta.completada && (
                    <span style={{ fontSize: '0.75rem', background: '#16a34a', color: '#fff', borderRadius: 10, padding: '0.15rem 0.5rem' }}>
                      ✓ Completada
                    </span>
                  )}
                </div>
                {meta.descripcion && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>{meta.descripcion}</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <button
                  onClick={() => toggleCompletada(meta)}
                  title={meta.completada ? 'Marcar como activa' : 'Marcar como completada'}
                  style={{ background: 'none', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                >
                  {meta.completada ? '↩ Reactivar' : '✓ Completar'}
                </button>
                <button
                  onClick={() => eliminar(meta.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1rem', padding: '0.25rem' }}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Barra de progreso (solo si tiene valor_meta) */}
            {meta.valor_meta != null && (
              <div style={{ marginTop: '0.75rem' }}>
                <BarraProgreso actual={meta.valor_actual} meta={meta.valor_meta} />

                {!meta.completada && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <input
                      type="number"
                      placeholder="Sumar..."
                      value={progreso[meta.id] ?? ''}
                      onChange={(e) => setProgreso({ ...progreso, [meta.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && actualizarProgreso(meta)}
                      style={{ width: 100, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
                    />
                    <button
                      onClick={() => actualizarProgreso(meta)}
                      style={{ padding: '0.3rem 0.6rem', borderRadius: 6, cursor: 'pointer', border: '1px solid #1a73e8', color: '#1a73e8', background: 'transparent', fontSize: '0.85rem' }}
                    >
                      + Sumar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Fecha límite */}
            {meta.fecha_limite && !meta.completada && (() => {
              const { texto, color } = diasRestantes(meta.fecha_limite);
              return (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color }}>
                  📅 {texto} · vence {new Date(meta.fecha_limite + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long' })}
                </p>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
