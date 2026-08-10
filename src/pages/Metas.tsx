import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Meta } from '../types';
import { PageHeader, Btn, Field, EmptyState, StatTile } from '../components/UI';

type Filtro = 'activas' | 'completadas' | 'todas';

const FORM0 = { titulo: '', descripcion: '', valor_meta: '', fecha_limite: '' };

function BarraProgreso({ actual, meta }: { actual: number; meta: number }) {
  const pct = Math.min(100, Math.round((actual / meta) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-2 mb-xs">
        <span>{actual.toLocaleString('es')} / {meta.toLocaleString('es')}</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill${pct >= 100 ? ' complete' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Metas() {
  const [metas, setMetas]         = useState<Meta[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [filtro, setFiltro]       = useState<Filtro>('activas');
  const [mostrarForm, setMostrar] = useState(false);
  const [form, setForm]           = useState(FORM0);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [progreso, setProgreso]   = useState<Record<string, string>>({});

  async function cargar() {
    const { data } = await supabase.from('metas').select('*').order('creado_en', { ascending: false });
    setMetas((data as Meta[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const filtradas = metas.filter(m =>
    filtro === 'activas' ? !m.completada : filtro === 'completadas' ? m.completada : true
  );

  async function guardar() {
    if (!form.titulo.trim()) { setErrorForm('El título es obligatorio'); return; }
    setGuardando(true); setErrorForm(null);
    const { error } = await supabase.from('metas').insert({
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      valor_meta: form.valor_meta ? parseFloat(form.valor_meta) : null,
      fecha_limite: form.fecha_limite || null,
    });
    setGuardando(false);
    if (error) { setErrorForm(error.message); return; }
    setForm(FORM0); setMostrar(false); cargar();
  }

  async function actualizarProgreso(meta: Meta) {
    const valor = parseFloat(progreso[meta.id] ?? '');
    if (isNaN(valor) || valor <= 0) return;
    const nuevo = meta.valor_actual + valor;
    const { error } = await supabase.from('metas').update({ valor_actual: nuevo }).eq('id', meta.id);
    if (!error) {
      setMetas(p => p.map(m => m.id === meta.id ? { ...m, valor_actual: nuevo } : m));
      setProgreso(p => ({ ...p, [meta.id]: '' }));
    }
  }

  async function toggleCompletada(meta: Meta) {
    const nuevoEstado = !meta.completada;
    const { error } = await supabase.from('metas').update({ completada: nuevoEstado }).eq('id', meta.id);
    if (!error) setMetas(p => p.map(m => m.id === meta.id ? { ...m, completada: nuevoEstado } : m));
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta meta?')) return;
    await supabase.from('metas').delete().eq('id', id);
    setMetas(p => p.filter(m => m.id !== id));
  }

  function diasRestantes(fecha: string) {
    const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { texto: `Venció hace ${Math.abs(diff)}d`, color: 'var(--error)' };
    if (diff === 0) return { texto: 'Vence hoy', color: 'var(--warning)' };
    if (diff <= 7) return { texto: `${diff}d restantes`, color: 'var(--warning)' };
    return { texto: `${diff}d restantes`, color: 'var(--text-2)' };
  }

  const activas = metas.filter(m => !m.completada).length;
  const completadas = metas.filter(m => m.completada).length;

  return (
    <div className="page">
      <PageHeader
        num="03 / METAS"
        title="Metas"
        sub="Objetivos y seguimiento de avance"
        actions={
          <Btn variant="primary" size="sm" onClick={() => { setMostrar(f => !f); setErrorForm(null); }}>
            {mostrarForm ? 'Cancelar' : '+ Nueva meta'}
          </Btn>
        }
      />

      {/* Resumen */}
      <div className="stat-grid stat-grid-3 mb-lg">
        <StatTile label="Activas" value={activas} />
        <StatTile label="Completadas" value={completadas} />
        <StatTile label="Total" value={metas.length} />
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="card mb-lg flex-col gap-md" style={{ maxWidth: 520 }}>
          <Field label="Título">
            <input className="input" placeholder="¿Qué quieres lograr?"
              value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
          </Field>
          <Field label="Descripción (opcional)">
            <textarea className="textarea-input" rows={2} value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })} />
          </Field>
          <div className="flex gap-sm">
            <Field label="Valor objetivo (opcional)">
              <input className="input" type="number" placeholder="Ej. 5000"
                value={form.valor_meta} onChange={e => setForm({ ...form, valor_meta: e.target.value })} />
            </Field>
            <Field label="Fecha límite (opcional)">
              <input className="input" type="date"
                value={form.fecha_limite} onChange={e => setForm({ ...form, fecha_limite: e.target.value })} />
            </Field>
          </div>
          {errorForm && <p className="text-sm text-error">{errorForm}</p>}
          <Btn variant="primary" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Crear meta'}
          </Btn>
        </div>
      )}

      {/* Filtros */}
      <div className="pill-tabs mb-lg">
        {(['activas', 'completadas', 'todas'] as Filtro[]).map(f => (
          <button key={f} className={`pill-tab${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando && <p className="text-sm text-2">Cargando...</p>}
      {!cargando && filtradas.length === 0 && (
        <EmptyState message={`No hay metas ${filtro === 'todas' ? '' : filtro} todavía.`} />
      )}

      <div className="flex-col gap-sm">
        {filtradas.map(meta => (
          <div key={meta.id} className={`meta-card${meta.completada ? ' done' : ''}`}>
            <div className="flex justify-between items-start gap-sm">
              <div className="flex-1">
                <div className="flex items-center gap-sm">
                  <span className={`font-600 text-md${meta.completada ? ' line-through text-2' : ''}`}>
                    {meta.titulo}
                  </span>
                  {meta.completada && <span className="badge badge-success">Completada</span>}
                </div>
                {meta.descripcion && <p className="text-sm text-2 mt-xs">{meta.descripcion}</p>}
              </div>

              <div className="flex gap-xs flex-shrink-0">
                <Btn variant="ghost" size="sm" onClick={() => toggleCompletada(meta)}>
                  {meta.completada ? '↩' : '✓'}
                </Btn>
                <Btn variant="danger" size="sm" onClick={() => eliminar(meta.id)}>✕</Btn>
              </div>
            </div>

            {meta.valor_meta != null && (
              <div className="mt-sm">
                <BarraProgreso actual={meta.valor_actual} meta={meta.valor_meta} />
                {!meta.completada && (
                  <div className="flex gap-xs mt-xs">
                    <input
                      type="number"
                      placeholder="Sumar..."
                      className="input"
                      style={{ width: 110 }}
                      value={progreso[meta.id] ?? ''}
                      onChange={e => setProgreso({ ...progreso, [meta.id]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && actualizarProgreso(meta)}
                    />
                    <Btn variant="ghost" size="sm" onClick={() => actualizarProgreso(meta)}>
                      + Sumar
                    </Btn>
                  </div>
                )}
              </div>
            )}

            {meta.fecha_limite && !meta.completada && (() => {
              const { texto, color } = diasRestantes(meta.fecha_limite);
              return (
                <p className="text-xs mt-xs" style={{ color }}>
                  {texto} · vence {new Date(meta.fecha_limite + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long' })}
                </p>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
