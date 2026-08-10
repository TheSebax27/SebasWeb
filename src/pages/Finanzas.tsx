import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Transaccion, CategoriaFinanzas, TipoTransaccion } from '../types';
import { PageHeader, Btn, Field, StatTile, EmptyState, inputCls, selectCls } from '../components/UI';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function primerDia(y: number, m: number) { return `${y}-${String(m+1).padStart(2,'0')}-01`; }
function ultimoDia(y: number, m: number) { return new Date(y, m+1, 0).toISOString().slice(0,10); }
function fmt(n: number) { return n.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtFecha(iso: string) { const [y,m,d]=iso.split('-'); return `${d} ${MESES[+m-1].slice(0,3)} ${y}`; }

const TX0 = { tipo: 'gasto' as TipoTransaccion, categoria_id: '', monto: '', descripcion: '', fecha: new Date().toISOString().slice(0,10) };
const CAT0 = { nombre: '', tipo: 'gasto' as 'ingreso'|'gasto'|'ambos', emoji: '' };

export function Finanzas() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes]   = useState(hoy.getMonth());
  const [txs, setTxs]   = useState<Transaccion[]>([]);
  const [cats, setCats] = useState<CategoriaFinanzas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showTx, setShowTx]   = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [formTx, setFormTx]   = useState(TX0);
  const [formCat, setFormCat] = useState(CAT0);
  const [guardando, setGuardando] = useState(false);
  const [errTx, setErrTx]   = useState<string|null>(null);
  const [errCat, setErrCat] = useState<string|null>(null);

  async function cargarCats() {
    const { data } = await supabase.from('categorias_finanzas').select('*').order('nombre');
    setCats((data as CategoriaFinanzas[]) ?? []);
  }
  async function cargarTxs() {
    setCargando(true);
    const { data } = await supabase.from('transacciones')
      .select('*, categorias_finanzas(*)')
      .gte('fecha', primerDia(anio,mes)).lte('fecha', ultimoDia(anio,mes))
      .order('fecha',{ascending:false}).order('creado_en',{ascending:false});
    setTxs((data as Transaccion[]) ?? []); setCargando(false);
  }
  useEffect(() => { cargarCats(); }, []);
  useEffect(() => { cargarTxs(); }, [anio, mes]);

  function mesPrev() { if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1); }
  function mesSig()  { if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1); }

  const ingresos = txs.filter(t=>t.tipo==='ingreso').reduce((s,t)=>s+ +t.monto,0);
  const gastos   = txs.filter(t=>t.tipo==='gasto').reduce((s,t)=>s+ +t.monto,0);
  const balance  = ingresos - gastos;

  async function crearTx() {
    if(!formTx.monto||+formTx.monto<=0){setErrTx('El monto debe ser mayor a 0');return;}
    setGuardando(true); setErrTx(null);
    const { error } = await supabase.from('transacciones').insert({
      tipo:formTx.tipo, categoria_id:formTx.categoria_id||null,
      monto:parseFloat(formTx.monto), descripcion:formTx.descripcion.trim()||null, fecha:formTx.fecha,
    });
    setGuardando(false);
    if(error){setErrTx(error.message);return;}
    setFormTx(TX0); setShowTx(false); cargarTxs();
  }

  async function eliminarTx(id: string) {
    if(!confirm('¿Eliminar esta transacción?'))return;
    await supabase.from('transacciones').delete().eq('id',id);
    setTxs(p=>p.filter(t=>t.id!==id));
  }

  async function crearCat() {
    if(!formCat.nombre.trim()){setErrCat('El nombre es obligatorio');return;}
    setGuardando(true); setErrCat(null);
    const { data, error } = await supabase.from('categorias_finanzas')
      .insert({nombre:formCat.nombre.trim(),tipo:formCat.tipo,emoji:formCat.emoji.trim()||null})
      .select().single();
    setGuardando(false);
    if(error){setErrCat(error.message);return;}
    setCats(p=>[...p,data as CategoriaFinanzas].sort((a,b)=>a.nombre.localeCompare(b.nombre)));
    setFormCat(CAT0);
  }

  async function eliminarCat(id: string) {
    if(!confirm('¿Eliminar esta categoría?'))return;
    await supabase.from('categorias_finanzas').delete().eq('id',id);
    setCats(p=>p.filter(c=>c.id!==id));
  }

  const catsFiltradas = cats.filter(c=>c.tipo===formTx.tipo||c.tipo==='ambos');
  const porFecha: { fecha: string; items: Transaccion[] }[] = [];
  for(const tx of txs){
    const last=porFecha[porFecha.length-1];
    if(last&&last.fecha===tx.fecha)last.items.push(tx);
    else porFecha.push({fecha:tx.fecha,items:[tx]});
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader
        num="02 / FINANZAS" title="Finanzas" sub="Resumen mensual de ingresos y gastos"
        actions={
          <>
            <Btn variant="ghost" size="sm" onClick={()=>{setShowCats(f=>!f);setShowTx(false);}}>Categorías</Btn>
            <Btn variant="primary" size="sm" onClick={()=>{setShowTx(f=>!f);setShowCats(false);setErrTx(null);}}>
              {showTx ? 'Cancelar' : '+ Agregar'}
            </Btn>
          </>
        }
      />

      {/* Panel categorías */}
      {showCats && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4">
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
            <Btn variant="primary" size="sm" onClick={crearCat} disabled={guardando}>Agregar</Btn>
          </div>
          {errCat && <p className="text-xs text-rose-400">{errCat}</p>}
        </div>
      )}

      {/* Form nueva transacción */}
      {showTx && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4 max-w-md">
          {/* Toggle ingreso/gasto */}
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
          <Btn variant="primary" onClick={crearTx} disabled={guardando}>{guardando?'Guardando...':'Guardar'}</Btn>
        </div>
      )}

      {/* Mes navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={mesPrev} className="w-8 h-8 rounded-lg border border-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors cursor-pointer">‹</button>
        <span className="font-serif text-xl text-gray-100 min-w-44 text-center">{MESES[mes]} {anio}</span>
        <button onClick={mesSig} className="w-8 h-8 rounded-lg border border-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors cursor-pointer">›</button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatTile label="Ingresos" value={`$${fmt(ingresos)}`} />
        <StatTile label="Gastos" value={`$${fmt(gastos)}`} />
        <StatTile label="Balance" value={`$${fmt(balance)}`} />
      </div>

      {/* Lista */}
      {cargando && <p className="text-sm text-gray-600">Cargando...</p>}
      {!cargando && txs.length===0 && <EmptyState message={`Sin movimientos en ${MESES[mes]}.`} />}
      {!cargando && porFecha.map(({fecha,items})=>(
        <div key={fecha} className="mb-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-600 mb-2">{fmtFecha(fecha)}</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
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
                    {tx.descripcion && <div className="text-xs text-gray-500">{tx.descripcion}</div>}
                  </div>
                  <div className={`text-sm font-semibold shrink-0 ${esI?'text-emerald-400':'text-rose-400'}`}>
                    {esI?'+':'-'}${fmt(+tx.monto)}
                  </div>
                  <Btn variant="danger" size="sm" onClick={()=>eliminarTx(tx.id)}>✕</Btn>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
