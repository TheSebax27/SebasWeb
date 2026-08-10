import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Transaccion, CategoriaFinanzas, TipoTransaccion } from '../types';

// ── helpers ──────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function primerDia(y: number, m: number) { return `${y}-${String(m+1).padStart(2,'0')}-01`; }
function ultimoDia (y: number, m: number) {
  return new Date(y, m + 1, 0).toISOString().slice(0, 10);
}
function fmtMonto(n: number) {
  return n.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtFechaCorta(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d} ${MESES[+m - 1].slice(0, 3)} ${y}`;
}

const FORM_TX_VACIO = { tipo: 'gasto' as TipoTransaccion, categoria_id: '', monto: '', descripcion: '', fecha: new Date().toISOString().slice(0, 10) };
const FORM_CAT_VACIO = { nombre: '', tipo: 'gasto' as 'ingreso'|'gasto'|'ambos', emoji: '' };

// ── componente ───────────────────────────────────────────────
export function Finanzas() {
  const hoy = new Date();
  const [anio, setAnio]   = useState(hoy.getFullYear());
  const [mes,  setMes]    = useState(hoy.getMonth());

  const [txs,  setTxs]   = useState<Transaccion[]>([]);
  const [cats, setCats]  = useState<CategoriaFinanzas[]>([]);
  const [cargando, setCargando] = useState(true);

  const [showFormTx,  setShowFormTx]  = useState(false);
  const [showCats,    setShowCats]    = useState(false);
  const [formTx,  setFormTx]  = useState(FORM_TX_VACIO);
  const [formCat, setFormCat] = useState(FORM_CAT_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorTx,  setErrorTx]  = useState<string | null>(null);
  const [errorCat, setErrorCat] = useState<string | null>(null);

  // ── carga ─────────────────────────────────────────────────
  async function cargarCategorias() {
    const { data } = await supabase.from('categorias_finanzas').select('*').order('nombre');
    setCats((data as CategoriaFinanzas[]) ?? []);
  }

  async function cargarTransacciones() {
    setCargando(true);
    const { data } = await supabase
      .from('transacciones')
      .select('*, categorias_finanzas(*)')
      .gte('fecha', primerDia(anio, mes))
      .lte('fecha', ultimoDia(anio, mes))
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false });
    setTxs((data as Transaccion[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargarCategorias(); }, []);
  useEffect(() => { cargarTransacciones(); }, [anio, mes]);

  // ── navegación de mes ─────────────────────────────────────
  function mesPrev() { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); }
  function mesSig()  { if (mes === 11) { setMes(0);  setAnio(a => a + 1); } else setMes(m => m + 1); }

  // ── resumen ───────────────────────────────────────────────
  const ingresos = txs.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + +t.monto, 0);
  const gastos   = txs.filter(t => t.tipo === 'gasto').reduce((s, t) => s + +t.monto, 0);
  const balance  = ingresos - gastos;

  // ── crear transacción ─────────────────────────────────────
  async function crearTx() {
    if (!formTx.monto || +formTx.monto <= 0) { setErrorTx('El monto debe ser mayor a 0'); return; }
    setGuardando(true); setErrorTx(null);
    const { error } = await supabase.from('transacciones').insert({
      tipo:         formTx.tipo,
      categoria_id: formTx.categoria_id || null,
      monto:        parseFloat(formTx.monto),
      descripcion:  formTx.descripcion.trim() || null,
      fecha:        formTx.fecha,
    });
    setGuardando(false);
    if (error) { setErrorTx(error.message); return; }
    setFormTx(FORM_TX_VACIO);
    setShowFormTx(false);
    cargarTransacciones();
  }

  async function eliminarTx(id: string) {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await supabase.from('transacciones').delete().eq('id', id);
    setTxs(p => p.filter(t => t.id !== id));
  }

  // ── gestión de categorías ─────────────────────────────────
  async function crearCategoria() {
    if (!formCat.nombre.trim()) { setErrorCat('El nombre es obligatorio'); return; }
    setGuardando(true); setErrorCat(null);
    const { data, error } = await supabase
      .from('categorias_finanzas')
      .insert({ nombre: formCat.nombre.trim(), tipo: formCat.tipo, emoji: formCat.emoji.trim() || null })
      .select().single();
    setGuardando(false);
    if (error) { setErrorCat(error.message); return; }
    setCats(p => [...p, data as CategoriaFinanzas].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setFormCat(FORM_CAT_VACIO);
  }

  async function eliminarCategoria(id: string) {
    if (!confirm('¿Eliminar esta categoría? Las transacciones que la usan quedarán sin categoría.')) return;
    await supabase.from('categorias_finanzas').delete().eq('id', id);
    setCats(p => p.filter(c => c.id !== id));
  }

  // ── categorías disponibles según tipo de tx ───────────────
  const catsFiltradas = cats.filter(c => c.tipo === formTx.tipo || c.tipo === 'ambos');

  // ── agrupar txs por fecha ─────────────────────────────────
  const porFecha: { fecha: string; items: Transaccion[] }[] = [];
  for (const tx of txs) {
    const last = porFecha[porFecha.length - 1];
    if (last && last.fecha === tx.fecha) last.items.push(tx);
    else porFecha.push({ fecha: tx.fecha, items: [tx] });
  }

  // ── render ────────────────────────────────────────────────
  return (
    <div style={{ padding: '1rem', maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Finanzas</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => { setShowCats(!showCats); setShowFormTx(false); }}
            style={{ padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer', border: '1px solid #ddd', background: showCats ? '#f1f5f9' : 'transparent', fontSize: '0.85rem' }}
          >
            🏷 Categorías
          </button>
          <button
            onClick={() => { setShowFormTx(!showFormTx); setShowCats(false); setErrorTx(null); }}
            style={{ padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}
          >
            {showFormTx ? 'Cancelar' : '+ Agregar'}
          </button>
        </div>
      </div>

      {/* Panel de categorías */}
      {showCats && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', background: '#fafafa' }}>
          <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Mis categorías</strong>

          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.85rem' }}>
            {cats.length === 0 && <p style={{ color: '#aaa', fontSize: '0.85rem', margin: 0 }}>Sin categorías todavía.</p>}
            {cats.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', borderRadius: 6, padding: '0.4rem 0.6rem', border: '1px solid #eee' }}>
                <span>{c.emoji ?? '📌'}</span>
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{c.nombre}</span>
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: 10, background: c.tipo === 'ingreso' ? '#dcfce7' : c.tipo === 'gasto' ? '#fee2e2' : '#e8f0fe', color: '#444' }}>
                  {c.tipo}
                </span>
                <button onClick={() => eliminarCategoria(c.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '1rem', padding: 0 }}>✕</button>
              </div>
            ))}
          </div>

          {/* Form nueva categoría */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input
              placeholder="Emoji"
              value={formCat.emoji}
              onChange={e => setFormCat({ ...formCat, emoji: e.target.value })}
              style={{ width: 54, padding: '0.35rem 0.4rem', borderRadius: 6, border: '1px solid #ccc', textAlign: 'center', fontSize: '1rem' }}
            />
            <input
              placeholder="Nombre *"
              value={formCat.nombre}
              onChange={e => setFormCat({ ...formCat, nombre: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && crearCategoria()}
              style={{ flex: 1, minWidth: 120, padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
            />
            <select
              value={formCat.tipo}
              onChange={e => setFormCat({ ...formCat, tipo: e.target.value as typeof formCat.tipo })}
              style={{ padding: '0.35rem 0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
              <option value="ambos">Ambos</option>
            </select>
            <button onClick={crearCategoria} disabled={guardando}
              style={{ padding: '0.35rem 0.75rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', fontSize: '0.85rem' }}>
              Agregar
            </button>
          </div>
          {errorCat && <p style={{ color: 'crimson', fontSize: '0.82rem', margin: '0.4rem 0 0' }}>{errorCat}</p>}
        </div>
      )}

      {/* Form nueva transacción */}
      {showFormTx && (
        <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

          {/* Toggle ingreso / gasto */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
            {(['gasto', 'ingreso'] as TipoTransaccion[]).map(t => (
              <button key={t} onClick={() => setFormTx({ ...formTx, tipo: t, categoria_id: '' })}
                style={{
                  flex: 1, padding: '0.45rem', cursor: 'pointer', border: 'none',
                  background: formTx.tipo === t ? (t === 'gasto' ? '#fee2e2' : '#dcfce7') : 'transparent',
                  color: formTx.tipo === t ? (t === 'gasto' ? '#dc2626' : '#16a34a') : '#666',
                  fontWeight: formTx.tipo === t ? 700 : 400,
                  textTransform: 'capitalize',
                }}>
                {t === 'gasto' ? '↑ Gasto' : '↓ Ingreso'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Monto */}
            <input
              type="number"
              placeholder="Monto *"
              value={formTx.monto}
              onChange={e => setFormTx({ ...formTx, monto: e.target.value })}
              style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem' }}
            />
            {/* Fecha */}
            <input
              type="date"
              value={formTx.fecha}
              onChange={e => setFormTx({ ...formTx, fecha: e.target.value })}
              style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
            />
          </div>

          {/* Categoría */}
          <select
            value={formTx.categoria_id}
            onChange={e => setFormTx({ ...formTx, categoria_id: e.target.value })}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', color: formTx.categoria_id ? 'inherit' : '#999' }}
          >
            <option value="">Sin categoría</option>
            {catsFiltradas.map(c => (
              <option key={c.id} value={c.id}>{c.emoji ? c.emoji + ' ' : ''}{c.nombre}</option>
            ))}
          </select>

          {/* Descripción */}
          <input
            placeholder="Descripción (opcional)"
            value={formTx.descripcion}
            onChange={e => setFormTx({ ...formTx, descripcion: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && crearTx()}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
          />

          {errorTx && <p style={{ color: 'crimson', margin: 0, fontSize: '0.85rem' }}>{errorTx}</p>}

          <button onClick={crearTx} disabled={guardando}
            style={{ padding: '0.5rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Navegación de mes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={mesPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem 0.5rem' }}>‹</button>
        <strong style={{ fontSize: '1.05rem', minWidth: 160, textAlign: 'center' }}>{MESES[mes]} {anio}</strong>
        <button onClick={mesSig} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem 0.5rem' }}>›</button>
      </div>

      {/* Resumen del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Ingresos', valor: ingresos, color: '#dcfce7', texto: '#16a34a' },
          { label: 'Gastos',   valor: gastos,   color: '#fee2e2', texto: '#dc2626' },
          { label: 'Balance',  valor: balance,  color: balance >= 0 ? '#e8f0fe' : '#fff1f2', texto: balance >= 0 ? '#1a73e8' : '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: s.color, borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.texto }}>${fmtMonto(s.valor)}</div>
            <div style={{ fontSize: '0.78rem', color: '#555', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lista de transacciones */}
      {cargando && <p style={{ color: '#888', textAlign: 'center' }}>Cargando…</p>}

      {!cargando && txs.length === 0 && (
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '2rem' }}>Sin movimientos en {MESES[mes]}.</p>
      )}

      {!cargando && porFecha.map(({ fecha, items }) => (
        <div key={fecha} style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {fmtFechaCorta(fecha)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {items.map(tx => {
              const cat = tx.categorias_finanzas;
              const esIngreso = tx.tipo === 'ingreso';
              return (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  background: '#fff', border: '1px solid #f0f0f0',
                  borderRadius: 8, padding: '0.6rem 0.75rem',
                }}>
                  <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {cat?.emoji ?? (esIngreso ? '💰' : '💸')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      {cat?.nombre ?? 'Sin categoría'}
                    </span>
                    {tx.descripcion && (
                      <span style={{ marginLeft: '0.4rem', fontSize: '0.82rem', color: '#777' }}>
                        · {tx.descripcion}
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: esIngreso ? '#16a34a' : '#dc2626', flexShrink: 0 }}>
                    {esIngreso ? '+' : '-'}${fmtMonto(+tx.monto)}
                  </span>
                  <button onClick={() => eliminarTx(tx.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '1rem', padding: 0, flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
