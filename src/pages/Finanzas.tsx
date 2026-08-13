import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Transaccion, CategoriaFinanzas, TipoTransaccion, Prestamo, TipoPrestamo, EstadoPrestamo } from '../types';
import { PageHeader, Btn, Field, StatTile, EmptyState, ConfirmDialog, inputCls, selectCls } from '../components/UI';

/* ── Helpers ── */
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function primerDia(y: number, m: number) { return `${y}-${String(m+1).padStart(2,'0')}-01`; }
function ultimoDia(y: number, m: number) { return new Date(y, m+1, 0).toISOString().slice(0,10); }
function fmt(n: number) { return n.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtFecha(iso: string) { const [y,m,d]=iso.split('-'); return `${d} ${MESES[+m-1].slice(0,3)} ${y}`; }
function hoyIso() { return new Date().toISOString().slice(0,10); }

const TX0  = { tipo: 'gasto' as TipoTransaccion, categoria_id: '', monto: '', descripcion: '', fecha: hoyIso() };
const CAT0 = { nombre: '', tipo: 'gasto' as 'ingreso'|'gasto'|'ambos', emoji: '' };
const PR0  = { tipo: 'prestado' as TipoPrestamo, persona: '', monto: '', descripcion: '', fecha: hoyIso() };

/* ── Componente ── */
export function Finanzas() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes,  setMes]  = useState(hoy.getMonth());
  const [tab,  setTab]  = useState<'movimientos'|'prestamos'>('movimientos');

  /* Transacciones */
  const [txs,     setTxs]     = useState<Transaccion[]>([]);
  const [cats,    setCats]    = useState<CategoriaFinanzas[]>([]);
  const [cargTx,  setCargTx]  = useState(true);
  const [showTx,  setShowTx]  = useState(false);
  const [showCats,setShowCats]= useState(false);
  const [formTx,  setFormTx]  = useState(TX0);
  const [formCat, setFormCat] = useState(CAT0);
  const [guardandoTx,  setGuardandoTx]  = useState(false);
  const [guardandoCat, setGuardandoCat] = useState(false);
  const [errTx,  setErrTx]   = useState<string|null>(null);
  const [errCat, setErrCat]  = useState<string|null>(null);
  const [confirmTx, setConfirmTx] = useState<Transaccion|null>(null);

  /* Préstamos */
  const [prestamos,    setPrestamos]    = useState<Prestamo[]>([]);
  const [cargPr,       setCargPr]       = useState(true);
  const [showFormPr,   setShowFormPr]   = useState(false);
  const [formPr,       setFormPr]       = useState(PR0);
  const [guardandoPr,  setGuardandoPr]  = useState(false);
  const [errPr,        setErrPr]        = useState<string|null>(null);
  const [devolviendo,  setDevolviendo]  = useState<string|null>(null); // id del préstamo
  const [formDev,      setFormDev]      = useState({ monto: '', fecha: hoyIso() });
  const [guardandoDev, setGuardandoDev] = useState(false);
  const [errDev,       setErrDev]       = useState<string|null>(null);
  const [confirmPr,    setConfirmPr]    = useState<Prestamo|null>(null);

  /* ── Carga ── */
  async function cargarCats() {
    const { data } = await supabase.from('categorias_finanzas').select('*').order('nombre');
    setCats((data as CategoriaFinanzas[]) ?? []);
  }
  async function cargarTxs() {
    setCargTx(true);
    const { data } = await supabase.from('transacciones')
      .select('*, categorias_finanzas(*)')
      .gte('fecha', primerDia(anio,mes)).lte('fecha', ultimoDia(anio,mes))
      .order('fecha',{ascending:false}).order('creado_en',{ascending:false});
    setTxs((data as Transaccion[]) ?? []); setCargTx(false);
  }
  async function cargarPrestamos() {
    setCargPr(true);
    const { data } = await supabase.from('prestamos').select('*').order('fecha',{ascending:false});
    setPrestamos((data as Prestamo[]) ?? []); setCargPr(false);
  }

  useEffect(() => { cargarCats(); cargarPrestamos(); }, []);
  useEffect(() => { cargarTxs(); }, [anio, mes]);

  function mesPrev() { if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1); }
  function mesSig()  { if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1); }

  /* ── Stats ── */
  const ingresos = txs.filter(t=>t.tipo==='ingreso').reduce((s,t)=>s+ +t.monto,0);
  const gastos   = txs.filter(t=>t.tipo==='gasto').reduce((s,t)=>s+ +t.monto,0);
  const balance  = ingresos - gastos;

  const porCobrar = prestamos
    .filter(p=>p.tipo==='prestado' && p.estado!=='saldado')
    .reduce((s,p)=>s + (+p.monto - +p.monto_devuelto), 0);
  const porPagar = prestamos
    .filter(p=>p.tipo==='recibido' && p.estado!=='saldado')
    .reduce((s,p)=>s + (+p.monto - +p.monto_devuelto), 0);
  const prestamosActivos = prestamos.filter(p=>p.estado!=='saldado').length;

  /* ── Transacciones CRUD ── */
  async function crearTx() {
    if(!formTx.monto||+formTx.monto<=0){setErrTx('El monto debe ser mayor a 0');return;}
    setGuardandoTx(true); setErrTx(null);
    const { error } = await supabase.from('transacciones').insert({
      tipo:formTx.tipo, categoria_id:formTx.categoria_id||null,
      monto:parseFloat(formTx.monto), descripcion:formTx.descripcion.trim()||null, fecha:formTx.fecha,
    });
    setGuardandoTx(false);
    if(error){setErrTx(error.message);return;}
    setFormTx(TX0); setShowTx(false); cargarTxs();
  }

  async function eliminarTx() {
    if(!confirmTx) return;
    await supabase.from('transacciones').delete().eq('id',confirmTx.id);
    setConfirmTx(null); cargarTxs();
  }

  async function crearCat() {
    if(!formCat.nombre.trim()){setErrCat('El nombre es obligatorio');return;}
    setGuardandoCat(true); setErrCat(null);
    const { data, error } = await supabase.from('categorias_finanzas')
      .insert({nombre:formCat.nombre.trim(),tipo:formCat.tipo,emoji:formCat.emoji.trim()||null})
      .select().single();
    setGuardandoCat(false);
    if(error){setErrCat(error.message);return;}
    setCats(p=>[...p,data as CategoriaFinanzas].sort((a,b)=>a.nombre.localeCompare(b.nombre)));
    setFormCat(CAT0);
  }

  async function eliminarCat(id: string) {
    if(!confirm('¿Eliminar esta categoría?'))return;
    await supabase.from('categorias_finanzas').delete().eq('id',id);
    setCats(p=>p.filter(c=>c.id!==id));
  }

  /* ── Préstamos CRUD ── */
  async function crearPrestamo() {
    if(!formPr.persona.trim()){setErrPr('El nombre es obligatorio');return;}
    if(!formPr.monto||+formPr.monto<=0){setErrPr('El monto debe ser mayor a 0');return;}
    setGuardandoPr(true); setErrPr(null);

    const { error } = await supabase.from('prestamos').insert({
      tipo: formPr.tipo,
      persona: formPr.persona.trim(),
      monto: parseFloat(formPr.monto),
      descripcion: formPr.descripcion.trim()||null,
      fecha: formPr.fecha,
    });
    if(error){setErrPr(error.message); setGuardandoPr(false); return;}

    // Crear transacción automática
    const esPrestado = formPr.tipo === 'prestado';
    await supabase.from('transacciones').insert({
      tipo: esPrestado ? 'gasto' : 'ingreso',
      categoria_id: null,
      monto: parseFloat(formPr.monto),
      descripcion: esPrestado
        ? `🤝 Préstamo a ${formPr.persona.trim()}`
        : `💳 Préstamo de ${formPr.persona.trim()}`,
      fecha: formPr.fecha,
    });

    setGuardandoPr(false);
    setFormPr(PR0); setShowFormPr(false);
    cargarPrestamos(); cargarTxs();
  }

  async function registrarDevolucion(prestamo: Prestamo) {
    const montoNum = parseFloat(formDev.monto);
    const pendiente = +prestamo.monto - +prestamo.monto_devuelto;
    if(!formDev.monto || montoNum <= 0){setErrDev('El monto debe ser mayor a 0');return;}
    if(montoNum > pendiente){setErrDev(`El máximo a devolver es $${fmt(pendiente)}`);return;}

    setGuardandoDev(true); setErrDev(null);

    const nuevoDevuelto = +prestamo.monto_devuelto + montoNum;
    const nuevoEstado: EstadoPrestamo = nuevoDevuelto >= +prestamo.monto ? 'saldado' : 'parcial';

    await supabase.from('prestamos').update({
      monto_devuelto: nuevoDevuelto,
      estado: nuevoEstado,
      fecha_devolucion: nuevoEstado === 'saldado' ? formDev.fecha : prestamo.fecha_devolucion,
    }).eq('id', prestamo.id);

    // Transacción inversa
    const esPrestado = prestamo.tipo === 'prestado';
    await supabase.from('transacciones').insert({
      tipo: esPrestado ? 'ingreso' : 'gasto',
      categoria_id: null,
      monto: montoNum,
      descripcion: esPrestado
        ? `🤝 Devolución de ${prestamo.persona}`
        : `💳 Pago a ${prestamo.persona}`,
      fecha: formDev.fecha,
    });

    setGuardandoDev(false);
    setDevolviendo(null); setFormDev({ monto: '', fecha: hoyIso() });
    cargarPrestamos(); cargarTxs();
  }

  async function eliminarPrestamo() {
    if(!confirmPr) return;
    await supabase.from('prestamos').delete().eq('id', confirmPr.id);
    setConfirmPr(null); cargarPrestamos();
  }

  /* ── Agrupación de transacciones por fecha ── */
  const catsFiltradas = cats.filter(c=>c.tipo===formTx.tipo||c.tipo==='ambos');
  const porFecha: { fecha: string; items: Transaccion[] }[] = [];
  for(const tx of txs){
    const last=porFecha[porFecha.length-1];
    if(last&&last.fecha===tx.fecha) last.items.push(tx);
    else porFecha.push({fecha:tx.fecha, items:[tx]});
  }

  /* ── Agrupación de préstamos ── */
  const prestadosPendientes = prestamos.filter(p=>p.tipo==='prestado' && p.estado!=='saldado');
  const recibidosPendientes = prestamos.filter(p=>p.tipo==='recibido' && p.estado!=='saldado');
  const historial           = prestamos.filter(p=>p.estado==='saldado');

  /* ── UI helpers ── */
  function estadoBadge(p: Prestamo) {
    if(p.estado==='saldado')  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900">Saldado</span>;
    if(p.estado==='parcial')  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-400 border border-amber-900">Parcial</span>;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">Pendiente</span>;
  }

  function FilaPrestamo({ p, color }: { p: Prestamo; color: 'emerald'|'rose' }) {
    const pendiente = +p.monto - +p.monto_devuelto;
    const pct = Math.round((+p.monto_devuelto / +p.monto) * 100);
    const estaDevolviendo = devolviendo === p.id;

    return (
      <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        {/* Cabecera */}
        <div className="px-4 py-3 flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${color==='emerald'?'bg-emerald-950/60 border border-emerald-900':'bg-rose-950/60 border border-rose-900'}`}>
            {color==='emerald' ? '🤝' : '💳'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-100">{p.persona}</span>
              {estadoBadge(p)}
            </div>
            {p.descripcion && <p className="text-xs text-gray-500 mt-0.5">{p.descripcion}</p>}
            <p className="text-[11px] text-gray-600 mt-0.5">{fmtFecha(p.fecha)}</p>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-sm font-semibold ${color==='emerald'?'text-emerald-400':'text-rose-400'}`}>
              ${fmt(+p.monto)}
            </div>
            {p.estado !== 'saldado' && (
              <div className="text-[11px] text-gray-500">Pendiente: ${fmt(pendiente)}</div>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        {p.estado !== 'saldado' && p.monto_devuelto > 0 && (
          <div className="px-4 pb-2">
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${color==='emerald'?'bg-emerald-500':'bg-rose-500'}`} style={{width:`${pct}%`}} />
            </div>
            <p className="text-[10px] text-gray-600 mt-1">{pct}% devuelto</p>
          </div>
        )}

        {/* Acciones */}
        {p.estado !== 'saldado' && (
          <div className="px-4 pb-3">
            {estaDevolviendo ? (
              <div className="flex flex-col gap-2 pt-1 border-t border-gray-800">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Monto a devolver">
                    <input className={inputCls} type="number" placeholder={`Máx. $${fmt(pendiente)}`}
                      value={formDev.monto} onChange={e=>setFormDev({...formDev,monto:e.target.value})} autoFocus />
                  </Field>
                  <Field label="Fecha">
                    <input className={inputCls} type="date" value={formDev.fecha} onChange={e=>setFormDev({...formDev,fecha:e.target.value})} />
                  </Field>
                </div>
                {errDev && <p className="text-xs text-rose-400">{errDev}</p>}
                <div className="flex gap-2 flex-wrap">
                  <Btn variant="ghost" size="sm" onClick={() => setFormDev({...formDev, monto: String(pendiente)})}>
                    Saldo total (${fmt(pendiente)})
                  </Btn>
                  <Btn variant="primary" size="sm" onClick={() => registrarDevolucion(p)} disabled={guardandoDev}>
                    {guardandoDev ? 'Guardando...' : 'Confirmar'}
                  </Btn>
                  <Btn variant="text" size="sm" onClick={() => { setDevolviendo(null); setErrDev(null); setFormDev({monto:'',fecha:hoyIso()}); }}>
                    Cancelar
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                <Btn variant="ghost" size="sm" onClick={() => { setDevolviendo(p.id); setErrDev(null); }}>
                  {color==='emerald' ? '+ Registrar devolución' : '+ Registrar pago'}
                </Btn>
                <button onClick={() => setConfirmPr(p)}
                  className="ml-auto text-gray-700 hover:text-rose-400 transition-colors cursor-pointer p-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Saldado: solo mostrar info de fecha y botón eliminar */}
        {p.estado === 'saldado' && (
          <div className="px-4 pb-3 flex items-center justify-between border-t border-gray-800 pt-2">
            <p className="text-xs text-gray-600">
              {p.fecha_devolucion ? `Saldado el ${fmtFecha(p.fecha_devolucion)}` : 'Saldado'}
            </p>
            <button onClick={() => setConfirmPr(p)}
              className="text-gray-700 hover:text-rose-400 transition-colors cursor-pointer p-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader
        num="02 / FINANZAS" title="Finanzas" sub="Resumen mensual de ingresos y gastos"
        actions={
          tab === 'movimientos' ? (
            <>
              <Btn variant="ghost" size="sm" onClick={()=>{setShowCats(f=>!f);setShowTx(false);}}>Categorías</Btn>
              <Btn variant="primary" size="sm" onClick={()=>{setShowTx(f=>!f);setShowCats(false);setErrTx(null);}}>
                {showTx ? 'Cancelar' : '+ Agregar'}
              </Btn>
            </>
          ) : (
            <Btn variant="primary" size="sm" onClick={()=>{setShowFormPr(f=>!f);setErrPr(null);}}>
              {showFormPr ? 'Cancelar' : '+ Nuevo préstamo'}
            </Btn>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900/50 p-1 rounded-xl border border-gray-800 mb-6">
        <button onClick={()=>setTab('movimientos')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${tab==='movimientos'?'bg-gray-800 text-gray-100 shadow-sm':'text-gray-600 hover:text-gray-400'}`}>
          Movimientos
        </button>
        <button onClick={()=>setTab('prestamos')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${tab==='prestamos'?'bg-gray-800 text-gray-100 shadow-sm':'text-gray-600 hover:text-gray-400'}`}>
          Préstamos
          {prestamosActivos > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-gray-950 text-[9px] font-bold">
              {prestamosActivos}
            </span>
          )}
        </button>
      </div>

      {/* ══ TAB MOVIMIENTOS ══ */}
      {tab === 'movimientos' && (
        <>
          {/* Panel categorías */}
          {showCats && (
            <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4">
              <p className="text-xs font-semibold text-gray-400">Categorías</p>
              <div className="flex flex-col gap-1.5">
                {cats.length===0 && <p className="text-xs text-gray-600">Sin categorías todavía.</p>}
                {cats.map(c=>(
                  <div key={c.id} className="flex items-center gap-2.5 bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-base">{c.emoji??'📌'}</span>
                    <span className="flex-1 text-sm text-gray-200">{c.nombre}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.tipo==='ingreso'?'bg-emerald-950 text-emerald-400':c.tipo==='gasto'?'bg-rose-950 text-rose-400':'bg-gray-700 text-gray-400'}`}>
                      {c.tipo}
                    </span>
                    <Btn variant="danger" size="sm" onClick={()=>eliminarCat(c.id)}>✕</Btn>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap items-end">
                <div style={{width:52}}>
                  <Field label="Emoji">
                    <input className={inputCls} value={formCat.emoji} onChange={e=>setFormCat({...formCat,emoji:e.target.value})} style={{textAlign:'center',fontSize:'1rem'}} />
                  </Field>
                </div>
                <div className="flex-1" style={{minWidth:120}}>
                  <Field label="Nombre">
                    <input className={inputCls} value={formCat.nombre} onChange={e=>setFormCat({...formCat,nombre:e.target.value})} onKeyDown={e=>e.key==='Enter'&&crearCat()} />
                  </Field>
                </div>
                <div>
                  <Field label="Tipo">
                    <select className={selectCls} value={formCat.tipo} onChange={e=>setFormCat({...formCat,tipo:e.target.value as typeof formCat.tipo})}>
                      <option value="gasto">Gasto</option>
                      <option value="ingreso">Ingreso</option>
                      <option value="ambos">Ambos</option>
                    </select>
                  </Field>
                </div>
                <Btn variant="primary" size="sm" onClick={crearCat} disabled={guardandoCat}>Agregar</Btn>
              </div>
              {errCat && <p className="text-xs text-rose-400">{errCat}</p>}
            </div>
          )}

          {/* Form nueva transacción */}
          {showTx && (
            <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4 max-w-md">
              <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-700">
                {(['gasto','ingreso'] as TipoTransaccion[]).map(t=>(
                  <button key={t} onClick={()=>setFormTx({...formTx,tipo:t,categoria_id:''})}
                    className={`py-2 text-sm font-medium cursor-pointer transition-colors duration-150 ${formTx.tipo===t?(t==='gasto'?'bg-rose-950 text-rose-400':'bg-emerald-950 text-emerald-400'):'bg-transparent text-gray-500 hover:text-gray-300'}`}>
                    {t==='gasto'?'↑ Gasto':'↓ Ingreso'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monto">
                  <input className={inputCls} type="number" placeholder="0.00" value={formTx.monto} onChange={e=>setFormTx({...formTx,monto:e.target.value})} />
                </Field>
                <Field label="Fecha">
                  <input className={inputCls} type="date" value={formTx.fecha} onChange={e=>setFormTx({...formTx,fecha:e.target.value})} />
                </Field>
              </div>
              <Field label="Categoría">
                <select className={selectCls} value={formTx.categoria_id} onChange={e=>setFormTx({...formTx,categoria_id:e.target.value})}>
                  <option value="">Sin categoría</option>
                  {catsFiltradas.map(c=><option key={c.id} value={c.id}>{c.emoji?c.emoji+' ':''}{c.nombre}</option>)}
                </select>
              </Field>
              <Field label="Descripción (opcional)">
                <input className={inputCls} value={formTx.descripcion} onChange={e=>setFormTx({...formTx,descripcion:e.target.value})} onKeyDown={e=>e.key==='Enter'&&crearTx()} />
              </Field>
              {errTx && <p className="text-xs text-rose-400">{errTx}</p>}
              <Btn variant="primary" onClick={crearTx} disabled={guardandoTx}>{guardandoTx?'Guardando...':'Guardar'}</Btn>
            </div>
          )}

          {/* Navegación mes */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={mesPrev} className="w-8 h-8 rounded-lg border border-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors cursor-pointer">‹</button>
            <span className="font-serif text-xl text-gray-100 min-w-44 text-center">{MESES[mes]} {anio}</span>
            <button onClick={mesSig} className="w-8 h-8 rounded-lg border border-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors cursor-pointer">›</button>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatTile label="Ingresos" value={`$${fmt(ingresos)}`} />
            <StatTile label="Gastos"   value={`$${fmt(gastos)}`} />
            <StatTile label="Balance"  value={`$${fmt(balance)}`} />
          </div>

          {/* Lista de transacciones */}
          {cargTx && <p className="text-sm text-gray-600">Cargando...</p>}
          {!cargTx && txs.length===0 && <EmptyState message={`Sin movimientos en ${MESES[mes]}.`} />}
          {!cargTx && porFecha.map(({fecha,items})=>(
            <div key={fecha} className="mb-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-600 mb-2">{fmtFecha(fecha)}</p>
              <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
                {items.map((tx,i)=>{
                  const cat=tx.categorias_finanzas;
                  const esI=tx.tipo==='ingreso';
                  return (
                    <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors ${i<items.length-1?'border-b border-gray-800':''}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-base shrink-0">
                        {cat?.emoji??(esI?'↓':'↑')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200">{cat?.nombre??'Sin categoría'}</div>
                        {tx.descripcion && <div className="text-xs text-gray-500 truncate">{tx.descripcion}</div>}
                      </div>
                      <div className={`text-sm font-semibold shrink-0 ${esI?'text-emerald-400':'text-rose-400'}`}>
                        {esI?'+':'-'}${fmt(+tx.monto)}
                      </div>
                      <button onClick={()=>setConfirmTx(tx)}
                        className="text-gray-700 hover:text-rose-400 transition-colors cursor-pointer p-1 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ══ TAB PRÉSTAMOS ══ */}
      {tab === 'prestamos' && (
        <>
          {/* Form nuevo préstamo */}
          {showFormPr && (
            <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4 max-w-md">
              {/* Toggle tipo */}
              <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-700">
                {(['prestado','recibido'] as TipoPrestamo[]).map(t=>(
                  <button key={t} onClick={()=>setFormPr({...formPr,tipo:t})}
                    className={`py-2.5 text-sm font-medium cursor-pointer transition-colors duration-150 leading-tight ${formPr.tipo===t?(t==='prestado'?'bg-emerald-950 text-emerald-400':'bg-rose-950 text-rose-400'):'bg-transparent text-gray-500 hover:text-gray-300'}`}>
                    {t==='prestado'?'🤝 Yo presté':'💳 Me prestaron'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 -mt-2">
                {formPr.tipo==='prestado'
                  ? 'Le presté dinero a alguien → descuenta de mi balance hasta que me lo devuelvan.'
                  : 'Me prestaron dinero → suma a mi balance hasta que yo lo pague.'}
              </p>
              <Field label="Persona">
                <input className={inputCls} placeholder="Nombre de quien presta o pide" value={formPr.persona} onChange={e=>setFormPr({...formPr,persona:e.target.value})} autoFocus />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monto">
                  <input className={inputCls} type="number" placeholder="0.00" value={formPr.monto} onChange={e=>setFormPr({...formPr,monto:e.target.value})} />
                </Field>
                <Field label="Fecha">
                  <input className={inputCls} type="date" value={formPr.fecha} onChange={e=>setFormPr({...formPr,fecha:e.target.value})} />
                </Field>
              </div>
              <Field label="Descripción (opcional)">
                <input className={inputCls} placeholder="Ej. Para el viaje, gastos de comida..." value={formPr.descripcion} onChange={e=>setFormPr({...formPr,descripcion:e.target.value})} onKeyDown={e=>e.key==='Enter'&&crearPrestamo()} />
              </Field>
              {errPr && <p className="text-xs text-rose-400">{errPr}</p>}
              <Btn variant="primary" onClick={crearPrestamo} disabled={guardandoPr}>{guardandoPr?'Guardando...':'Registrar préstamo'}</Btn>
            </div>
          )}

          {/* Stat tiles de préstamos */}
          {!cargPr && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              <StatTile label="🤝 Por cobrar" value={porCobrar > 0 ? `$${fmt(porCobrar)}` : '$0'} />
              <StatTile label="💳 Por pagar"  value={porPagar  > 0 ? `$${fmt(porPagar)}`  : '$0'} />
            </div>
          )}

          {cargPr && <p className="text-sm text-gray-600">Cargando...</p>}

          {!cargPr && prestamos.length === 0 && (
            <EmptyState message="No hay préstamos registrados." />
          )}

          {/* Presté */}
          {prestadosPendientes.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-3">🤝 Presté — por cobrar</p>
              <div className="flex flex-col gap-3">
                {prestadosPendientes.map(p=><FilaPrestamo key={p.id} p={p} color="emerald" />)}
              </div>
            </div>
          )}

          {/* Me prestaron */}
          {recibidosPendientes.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-3">💳 Me prestaron — por pagar</p>
              <div className="flex flex-col gap-3">
                {recibidosPendientes.map(p=><FilaPrestamo key={p.id} p={p} color="rose" />)}
              </div>
            </div>
          )}

          {/* Historial saldados */}
          {historial.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-3">✓ Historial saldados</p>
              <div className="flex flex-col gap-3">
                {historial.map(p=>(
                  <FilaPrestamo key={p.id} p={p} color={p.tipo==='prestado'?'emerald':'rose'} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs de confirmación */}
      <ConfirmDialog
        open={!!confirmTx}
        title="Eliminar transacción"
        message="Se eliminará esta transacción permanentemente."
        onConfirm={eliminarTx}
        onCancel={()=>setConfirmTx(null)}
      />
      <ConfirmDialog
        open={!!confirmPr}
        title={`Eliminar préstamo de ${confirmPr?.persona}`}
        message="Se eliminará el registro del préstamo. Las transacciones asociadas en el historial de movimientos NO se eliminan."
        onConfirm={eliminarPrestamo}
        onCancel={()=>setConfirmPr(null)}
      />
    </div>
  );
}
