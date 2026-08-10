import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Transaccion, CategoriaFinanzas, TipoTransaccion } from '../types';
import { PageHeader, Btn, Field, EmptyState, StatTile } from '../components/UI';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function primerDia(y: number, m: number) { return `${y}-${String(m+1).padStart(2,'0')}-01`; }
function ultimoDia(y: number, m: number) { return new Date(y, m + 1, 0).toISOString().slice(0, 10); }
function fmtMonto(n: number) { return n.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtFechaCorta(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d} ${MESES[+m - 1].slice(0, 3)} ${y}`;
}

const FORM_TX0 = { tipo: 'gasto' as TipoTransaccion, categoria_id: '', monto: '', descripcion: '', fecha: new Date().toISOString().slice(0, 10) };
const FORM_CAT0 = { nombre: '', tipo: 'gasto' as 'ingreso'|'gasto'|'ambos', emoji: '' };

export function Finanzas() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes]   = useState(hoy.getMonth());
  const [txs, setTxs]   = useState<Transaccion[]>([]);
  const [cats, setCats] = useState<CategoriaFinanzas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showFormTx, setShowFormTx]   = useState(false);
  const [showCats, setShowCats]       = useState(false);
  const [formTx, setFormTx]           = useState(FORM_TX0);
  const [formCat, setFormCat]         = useState(FORM_CAT0);
  const [guardando, setGuardando]     = useState(false);
  const [errorTx, setErrorTx]         = useState<string | null>(null);
  const [errorCat, setErrorCat]       = useState<string | null>(null);

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

  function mesPrev() { if (mes === 0) { setMes(11); setAnio(a => a-1); } else setMes(m => m-1); }
  function mesSig()  { if (mes === 11) { setMes(0);  setAnio(a => a+1); } else setMes(m => m+1); }

  const ingresos = txs.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + +t.monto, 0);
  const gastos   = txs.filter(t => t.tipo === 'gasto').reduce((s, t) => s + +t.monto, 0);
  const balance  = ingresos - gastos;

  async function crearTx() {
    if (!formTx.monto || +formTx.monto <= 0) { setErrorTx('El monto debe ser mayor a 0'); return; }
    setGuardando(true); setErrorTx(null);
    const { error } = await supabase.from('transacciones').insert({
      tipo: formTx.tipo,
      categoria_id: formTx.categoria_id || null,
      monto: parseFloat(formTx.monto),
      descripcion: formTx.descripcion.trim() || null,
      fecha: formTx.fecha,
    });
    setGuardando(false);
    if (error) { setErrorTx(error.message); return; }
    setFormTx(FORM_TX0); setShowFormTx(false); cargarTransacciones();
  }

  async function eliminarTx(id: string) {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await supabase.from('transacciones').delete().eq('id', id);
    setTxs(p => p.filter(t => t.id !== id));
  }

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
    setFormCat(FORM_CAT0);
  }

  async function eliminarCategoria(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await supabase.from('categorias_finanzas').delete().eq('id', id);
    setCats(p => p.filter(c => c.id !== id));
  }

  const catsFiltradas = cats.filter(c => c.tipo === formTx.tipo || c.tipo === 'ambos');

  const porFecha: { fecha: string; items: Transaccion[] }[] = [];
  for (const tx of txs) {
    const last = porFecha[porFecha.length - 1];
    if (last && last.fecha === tx.fecha) last.items.push(tx);
    else porFecha.push({ fecha: tx.fecha, items: [tx] });
  }

  return (
    <div className="page">
      <PageHeader
        num="02 / FINANZAS"
        title="Finanzas"
        sub="Seguimiento mensual de ingresos y gastos"
        actions={
          <>
            <Btn variant="ghost" size="sm" onClick={() => { setShowCats(f => !f); setShowFormTx(false); }}>
              Categorías
            </Btn>
            <Btn variant="primary" size="sm" onClick={() => { setShowFormTx(f => !f); setShowCats(false); setErrorTx(null); }}>
              {showFormTx ? 'Cancelar' : '+ Agregar'}
            </Btn>
          </>
        }
      />

      {/* Panel de categorías */}
      {showCats && (
        <div className="card mb-lg">
          <div className="font-500 mb-sm">Categorías</div>
          <div className="flex-col gap-xs mb-md">
            {cats.length === 0 && <p className="text-sm text-3">Sin categorías todavía.</p>}
            {cats.map(c => (
              <div key={c.id} className="card-sm flex items-center gap-sm">
                <span>{c.emoji ?? '📌'}</span>
                <span className="flex-1 text-sm">{c.nombre}</span>
                <span className={`badge ${c.tipo === 'ingreso' ? 'badge-success' : c.tipo === 'gasto' ? 'badge-error' : 'badge-neutral'}`}>
                  {c.tipo}
                </span>
                <Btn variant="danger" size="sm" onClick={() => eliminarCategoria(c.id)}>✕</Btn>
              </div>
            ))}
          </div>

          <div className="flex gap-sm flex-wrap items-end">
            <div style={{ width: 54 }}>
              <Field label="Emoji">
                <input className="input" value={formCat.emoji} onChange={e => setFormCat({ ...formCat, emoji: e.target.value })}
                  style={{ textAlign: 'center', fontSize: '1rem' }} />
              </Field>
            </div>
            <div className="flex-1" style={{ minWidth: 120 }}>
              <Field label="Nombre">
                <input className="input" value={formCat.nombre} onChange={e => setFormCat({ ...formCat, nombre: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && crearCategoria()} />
              </Field>
            </div>
            <div>
              <Field label="Tipo">
                <select className="select-input" value={formCat.tipo} onChange={e => setFormCat({ ...formCat, tipo: e.target.value as typeof formCat.tipo })}>
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="ambos">Ambos</option>
                </select>
              </Field>
            </div>
            <Btn variant="primary" size="sm" onClick={crearCategoria} disabled={guardando}>
              Agregar
            </Btn>
          </div>
          {errorCat && <p className="text-sm text-error mt-xs">{errorCat}</p>}
        </div>
      )}

      {/* Form nueva transacción */}
      {showFormTx && (
        <div className="card mb-lg flex-col gap-md" style={{ maxWidth: 480 }}>
          <div className="type-toggle">
            {(['gasto', 'ingreso'] as TipoTransaccion[]).map(t => (
              <button key={t} className={`type-toggle-btn ${formTx.tipo === t ? `active-${t}` : ''}`}
                onClick={() => setFormTx({ ...formTx, tipo: t, categoria_id: '' })}>
                {t === 'gasto' ? '↑ Gasto' : '↓ Ingreso'}
              </button>
            ))}
          </div>

          <div className="flex gap-sm">
            <Field label="Monto">
              <input className="input" type="number" placeholder="0.00"
                value={formTx.monto} onChange={e => setFormTx({ ...formTx, monto: e.target.value })} />
            </Field>
            <Field label="Fecha">
              <input className="input" type="date" value={formTx.fecha}
                onChange={e => setFormTx({ ...formTx, fecha: e.target.value })} />
            </Field>
          </div>

          <Field label="Categoría">
            <select className="select-input" value={formTx.categoria_id}
              onChange={e => setFormTx({ ...formTx, categoria_id: e.target.value })}>
              <option value="">Sin categoría</option>
              {catsFiltradas.map(c => (
                <option key={c.id} value={c.id}>{c.emoji ? c.emoji + ' ' : ''}{c.nombre}</option>
              ))}
            </select>
          </Field>

          <Field label="Descripción (opcional)">
            <input className="input" placeholder="Nota opcional"
              value={formTx.descripcion}
              onChange={e => setFormTx({ ...formTx, descripcion: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && crearTx()} />
          </Field>

          {errorTx && <p className="text-sm text-error">{errorTx}</p>}
          <Btn variant="primary" onClick={crearTx} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Btn>
        </div>
      )}

      {/* Navegación de mes */}
      <div className="flex items-center justify-center mb-lg">
        <div className="month-nav">
          <button className="month-nav-btn" onClick={mesPrev}>‹</button>
          <span className="month-nav-label">{MESES[mes]} {anio}</span>
          <button className="month-nav-btn" onClick={mesSig}>›</button>
        </div>
      </div>

      {/* Resumen del mes */}
      <div className="stat-grid stat-grid-3 mb-lg">
        <StatTile label="Ingresos" value={`$${fmtMonto(ingresos)}`} />
        <StatTile label="Gastos" value={`$${fmtMonto(gastos)}`} />
        <StatTile label="Balance" value={`$${fmtMonto(balance)}`} />
      </div>

      {/* Lista */}
      {cargando && <p className="text-sm text-2">Cargando...</p>}
      {!cargando && txs.length === 0 && (
        <EmptyState message={`Sin movimientos en ${MESES[mes]}.`} />
      )}

      {!cargando && porFecha.map(({ fecha, items }) => (
        <div key={fecha}>
          <div className="date-label">{fmtFechaCorta(fecha)}</div>
          <div className="card" style={{ padding: '0.2rem 1rem' }}>
            {items.map(tx => {
              const cat = tx.categorias_finanzas;
              const esIngreso = tx.tipo === 'ingreso';
              return (
                <div key={tx.id} className="tx-row">
                  <div className="tx-icon">
                    {cat?.emoji ?? (esIngreso ? '↓' : '↑')}
                  </div>
                  <div className="tx-info">
                    <div className="tx-cat">{cat?.nombre ?? 'Sin categoría'}</div>
                    {tx.descripcion && <div className="tx-desc">{tx.descripcion}</div>}
                  </div>
                  <div className={`tx-amount ${esIngreso ? 'in' : 'out'}`}>
                    {esIngreso ? '+' : '-'}${fmtMonto(+tx.monto)}
                  </div>
                  <Btn variant="danger" size="sm" onClick={() => eliminarTx(tx.id)}>✕</Btn>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
