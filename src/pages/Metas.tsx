import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Meta } from '../types';
import { PageHeader, Btn, Field, StatTile, EmptyState, inputCls, textareaCls } from '../components/UI';

type Filtro = 'activas' | 'completadas' | 'todas';
const FORM0 = { titulo: '', descripcion: '', valor_meta: '', fecha_limite: '' };

function BarraProgreso({ actual, meta }: { actual: number; meta: number }) {
  const pct = Math.min(100, Math.round((actual / meta) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{actual.toLocaleString('es')} / {meta.toLocaleString('es')}</span>
        <span className={pct >= 100 ? 'text-emerald-400' : 'text-gray-400'}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full progress-fill ${pct >= 100 ? 'bg-emerald-400' : 'bg-emerald-600'}`}
          style={{ width: `${pct}%` }} />
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
  const [errorForm, setErrorForm] = useState<string|null>(null);
  const [progreso, setProgreso]   = useState<Record<string,string>>({});

  async function cargar() {
    const { data } = await supabase.from('metas').select('*').order('creado_en',{ascending:false});
    setMetas((data as Meta[]) ?? []); setCargando(false);
  }
  useEffect(() => { cargar(); }, []);

  const filtradas = metas.filter(m=>filtro==='activas'?!m.completada:filtro==='completadas'?m.completada:true);

  async function guardar() {
    if(!form.titulo.trim()){setErrorForm('El título es obligatorio');return;}
    setGuardando(true); setErrorForm(null);
    const { error } = await supabase.from('metas').insert({
      titulo:form.titulo.trim(), descripcion:form.descripcion.trim()||null,
      valor_meta:form.valor_meta?parseFloat(form.valor_meta):null, fecha_limite:form.fecha_limite||null,
    });
    setGuardando(false);
    if(error){setErrorForm(error.message);return;}
    setForm(FORM0); setMostrar(false); cargar();
  }

  async function actualizarProgreso(meta: Meta) {
    const v=parseFloat(progreso[meta.id]??'');
    if(isNaN(v)||v<=0)return;
    const nuevo=meta.valor_actual+v;
    const { error } = await supabase.from('metas').update({valor_actual:nuevo}).eq('id',meta.id);
    if(!error){ setMetas(p=>p.map(m=>m.id===meta.id?{...m,valor_actual:nuevo}:m)); setProgreso(p=>({...p,[meta.id]:''})); }
  }

  async function toggleCompletada(meta: Meta) {
    const n=!meta.completada;
    await supabase.from('metas').update({completada:n}).eq('id',meta.id);
    setMetas(p=>p.map(m=>m.id===meta.id?{...m,completada:n}:m));
  }

  async function eliminar(id: string) {
    if(!confirm('¿Eliminar esta meta?'))return;
    await supabase.from('metas').delete().eq('id',id);
    setMetas(p=>p.filter(m=>m.id!==id));
  }

  function diasRestantes(fecha: string) {
    const diff=Math.ceil((new Date(fecha).getTime()-Date.now())/86400000);
    if(diff<0) return { texto:`Venció hace ${Math.abs(diff)}d`, cls:'text-rose-400' };
    if(diff===0) return { texto:'Vence hoy', cls:'text-amber-400' };
    if(diff<=7) return { texto:`${diff}d restantes`, cls:'text-amber-400' };
    return { texto:`${diff}d restantes`, cls:'text-gray-500' };
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader num="03 / METAS" title="Metas" sub="Objetivos y seguimiento de avance"
        actions={<Btn variant="primary" size="sm" onClick={()=>{setMostrar(f=>!f);setErrorForm(null);}}>{mostrarForm?'Cancelar':'+ Nueva meta'}</Btn>}
      />

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatTile label="Activas" value={metas.filter(m=>!m.completada).length} />
        <StatTile label="Completadas" value={metas.filter(m=>m.completada).length} />
        <StatTile label="Total" value={metas.length} />
      </div>

      {mostrarForm && (
        <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4 max-w-lg">
          <Field label="Título">
            <input className={inputCls} placeholder="¿Qué quieres lograr?" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} />
          </Field>
          <Field label="Descripción (opcional)">
            <textarea className={textareaCls} rows={2} value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor objetivo (opcional)">
              <input className={inputCls} type="number" placeholder="Ej. 5000" value={form.valor_meta} onChange={e=>setForm({...form,valor_meta:e.target.value})} />
            </Field>
            <Field label="Fecha límite (opcional)">
              <input className={inputCls} type="date" value={form.fecha_limite} onChange={e=>setForm({...form,fecha_limite:e.target.value})} />
            </Field>
          </div>
          {errorForm && <p className="text-xs text-rose-400">{errorForm}</p>}
          <Btn variant="primary" onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Crear meta'}</Btn>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(['activas','completadas','todas'] as Filtro[]).map(f=>(
          <button key={f} onClick={()=>setFiltro(f)}
            className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-150 font-medium ${filtro===f?'bg-emerald-500 border-emerald-500 text-gray-950':'bg-transparent border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {cargando && <p className="text-sm text-gray-600">Cargando...</p>}
      {!cargando && filtradas.length===0 && <EmptyState message={`No hay metas ${filtro==='todas'?'':filtro} todavía.`} />}

      <div className="flex flex-col gap-3">
        {filtradas.map(meta=>(
          <div key={meta.id} className={`bg-gray-900/70 backdrop-blur-sm border rounded-xl p-5 transition-colors ${meta.completada?'border-gray-800 opacity-70':'border-gray-800 hover:border-gray-700'}`}>
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${meta.completada?'text-gray-500 line-through':'text-gray-100'}`}>{meta.titulo}</span>
                  {meta.completada && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900">Completada</span>}
                </div>
                {meta.descripcion && <p className="mt-1 text-xs text-gray-500">{meta.descripcion}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Btn variant="ghost" size="sm" onClick={()=>toggleCompletada(meta)}>{meta.completada?'↩':'✓'}</Btn>
                <Btn variant="danger" size="sm" onClick={()=>eliminar(meta.id)}>✕</Btn>
              </div>
            </div>

            {meta.valor_meta!=null && (
              <div className="mt-4">
                <BarraProgreso actual={meta.valor_actual} meta={meta.valor_meta} />
                {!meta.completada && (
                  <div className="flex gap-2 mt-2">
                    <input type="number" placeholder="Sumar..." className={inputCls} style={{width:110}}
                      value={progreso[meta.id]??''} onChange={e=>setProgreso({...progreso,[meta.id]:e.target.value})}
                      onKeyDown={e=>e.key==='Enter'&&actualizarProgreso(meta)} />
                    <Btn variant="ghost" size="sm" onClick={()=>actualizarProgreso(meta)}>+ Sumar</Btn>
                  </div>
                )}
              </div>
            )}

            {meta.fecha_limite && !meta.completada && (()=>{
              const {texto,cls}=diasRestantes(meta.fecha_limite);
              return <p className={`mt-2 text-xs ${cls}`}>{texto} · vence {new Date(meta.fecha_limite+'T12:00:00').toLocaleDateString('es',{day:'numeric',month:'long'})}</p>;
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
