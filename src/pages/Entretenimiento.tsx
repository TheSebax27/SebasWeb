import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { EntretenimientoItem, TipoEntretenimiento, EstadoEntretenimiento } from '../types';
import { PageHeader, Btn, Field, EmptyState, inputCls, textareaCls } from '../components/UI';

const TIPOS: { valor: TipoEntretenimiento; label: string; emoji: string }[] = [
  { valor: 'pelicula', label: 'Película', emoji: '🎬' },
  { valor: 'serie',    label: 'Serie',    emoji: '📺' },
  { valor: 'juego',    label: 'Juego',    emoji: '🎮' },
];

const ESTADOS: { valor: EstadoEntretenimiento; label: string; cls: string }[] = [
  { valor: 'quiero',      label: 'Lo quiero',    cls: 'bg-gray-800 text-gray-400 border-gray-700' },
  { valor: 'en_progreso', label: 'En progreso',  cls: 'bg-amber-950/50 text-amber-400 border-amber-900' },
  { valor: 'visto',       label: 'Visto/Jugado', cls: 'bg-emerald-950/50 text-emerald-400 border-emerald-900' },
];

function estadoCls(estado: EstadoEntretenimiento) { return ESTADOS.find(e=>e.valor===estado)?.cls??''; }
function estadoLabel(estado: EstadoEntretenimiento) { return ESTADOS.find(e=>e.valor===estado)?.label??estado; }

function Estrellas({ rating, onChange }: { rating: number|null; onChange?: (v: number)=>void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n=>(
        <span key={n} onClick={()=>onChange?.(n)}
          className={`text-sm transition-colors ${n<=(rating??0)?'text-amber-400':'text-gray-700'} ${onChange?'cursor-pointer hover:text-amber-300':''}`}>
          ★
        </span>
      ))}
    </div>
  );
}

const FORM0 = { titulo:'', tipo:'pelicula' as TipoEntretenimiento, estado:'quiero' as EstadoEntretenimiento, rating:null as number|null, notas:'' };

export function Entretenimiento() {
  const [items, setItems]               = useState<EntretenimientoItem[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [tipoF, setTipoF]               = useState<TipoEntretenimiento|'todos'>('todos');
  const [estadoF, setEstadoF]           = useState<EstadoEntretenimiento|'todos'>('todos');
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [form, setForm]                 = useState(FORM0);
  const [guardando, setGuardando]       = useState(false);
  const [error, setError]               = useState<string|null>(null);

  async function cargar() {
    const { data } = await supabase.from('entretenimiento').select('*').order('creado_en',{ascending:false});
    setItems((data as EntretenimientoItem[])??[]); setCargando(false);
  }
  useEffect(() => { cargar(); }, []);

  const filtrados = items.filter(i=>{
    if(tipoF!=='todos'&&i.tipo!==tipoF)return false;
    if(estadoF!=='todos'&&i.estado!==estadoF)return false;
    return true;
  });

  async function guardar() {
    if(!form.titulo.trim()){setError('El título es obligatorio');return;}
    setGuardando(true); setError(null);
    const { error:err } = await supabase.from('entretenimiento').insert({
      titulo:form.titulo.trim(), tipo:form.tipo, estado:form.estado, rating:form.rating, notas:form.notas.trim()||null,
    });
    setGuardando(false);
    if(err){setError(err.message);return;}
    setForm(FORM0); setMostrarForm(false); cargar();
  }

  async function actualizarEstado(item: EntretenimientoItem, estado: EstadoEntretenimiento) {
    await supabase.from('entretenimiento').update({estado}).eq('id',item.id);
    setItems(p=>p.map(i=>i.id===item.id?{...i,estado}:i));
  }

  async function actualizarRating(item: EntretenimientoItem, rating: number) {
    await supabase.from('entretenimiento').update({rating}).eq('id',item.id);
    setItems(p=>p.map(i=>i.id===item.id?{...i,rating}:i));
  }

  async function eliminar(id: string) {
    if(!confirm('¿Eliminar este elemento?'))return;
    await supabase.from('entretenimiento').delete().eq('id',id);
    setItems(p=>p.filter(i=>i.id!==id));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader num="06 / ENTRETENIMIENTO" title="Entretenimiento" sub="Películas, series y juegos"
        actions={<Btn variant="primary" size="sm" onClick={()=>{setMostrarForm(f=>!f);setError(null);}}>{mostrarForm?'Cancelar':'+ Agregar'}</Btn>}
      />

      {/* Form */}
      {mostrarForm && (
        <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-6 flex flex-col gap-4 max-w-md">
          <Field label="Título">
            <input className={inputCls} placeholder="Nombre de la película, serie o juego" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} />
          </Field>
          <Field label="Tipo">
            <div className="flex gap-2">
              {TIPOS.map(t=>(
                <button key={t.valor} type="button" onClick={()=>setForm({...form,tipo:t.valor})}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border cursor-pointer transition-all ${form.tipo===t.valor?'bg-emerald-500 border-emerald-500 text-gray-950':'bg-transparent border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Estado">
            <div className="flex gap-2 flex-wrap">
              {ESTADOS.map(s=>(
                <button key={s.valor} type="button" onClick={()=>setForm({...form,estado:s.valor})}
                  className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${form.estado===s.valor?s.cls:' border-gray-700 text-gray-500 hover:border-gray-600'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Rating">
            <Estrellas rating={form.rating} onChange={v=>setForm({...form,rating:v})} />
          </Field>
          <Field label="Notas (opcional)">
            <textarea className={textareaCls} rows={2} value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} />
          </Field>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <Btn variant="primary" onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar'}</Btn>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setTipoF('todos')}
            className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all font-medium ${tipoF==='todos'?'bg-emerald-500 border-emerald-500 text-gray-950':'bg-transparent border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}>
            Todos
          </button>
          {TIPOS.map(t=>(
            <button key={t.valor} onClick={()=>setTipoF(t.valor)}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all font-medium ${tipoF===t.valor?'bg-emerald-500 border-emerald-500 text-gray-950':'bg-transparent border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}>
              {t.emoji} {t.label}s
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setEstadoF('todos')}
            className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all font-medium ${estadoF==='todos'?'bg-gray-600 border-gray-600 text-gray-100':'bg-transparent border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400'}`}>
            Todos
          </button>
          {ESTADOS.map(s=>(
            <button key={s.valor} onClick={()=>setEstadoF(s.valor)}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all font-medium ${estadoF===s.valor?s.cls:'bg-transparent border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {cargando && <p className="text-sm text-gray-600">Cargando...</p>}
      {!cargando && filtrados.length===0 && <EmptyState message="No hay elementos con estos filtros." />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(item=>{
          const tipoInfo=TIPOS.find(t=>t.valor===item.tipo)!;
          return (
            <div key={item.id} className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex flex-col gap-3 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{tipoInfo.emoji} {tipoInfo.label}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${estadoCls(item.estado)}`}>
                    {estadoLabel(item.estado)}
                  </span>
                </div>
                <Btn variant="danger" size="sm" onClick={()=>eliminar(item.id)}>✕</Btn>
              </div>

              <div className="text-sm font-semibold text-gray-100 leading-snug">{item.titulo}</div>
              <Estrellas rating={item.rating} onChange={v=>actualizarRating(item,v)} />
              {item.notas && <div className="text-xs text-gray-500">{item.notas}</div>}

              <div className="flex gap-1.5 flex-wrap pt-1 border-t border-gray-800">
                {ESTADOS.map(s=>(
                  <button key={s.valor} onClick={()=>actualizarEstado(item,s.valor)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border cursor-pointer transition-all font-medium ${item.estado===s.valor?s.cls:'bg-transparent border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400'}`}>
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
