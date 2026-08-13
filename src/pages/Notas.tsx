import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Nota } from '../types';
import { PageHeader, Btn, EmptyState } from '../components/UI';

const COLORES = [
  { valor: '#FEF9C3', label: 'Amarillo' },
  { valor: '#DCFCE7', label: 'Verde' },
  { valor: '#DBEAFE', label: 'Azul' },
  { valor: '#FCE7F3', label: 'Rosa' },
  { valor: '#EDE9FE', label: 'Violeta' },
  { valor: '#FFEDD5', label: 'Naranja' },
  { valor: '#F1F5F9', label: 'Gris' },
  { valor: '#FFFFFF', label: 'Blanco' },
];

interface NE { id: string|null; titulo: string; contenido: string; color: string; }
const N0: NE = { id: null, titulo: '', contenido: '', color: '#FEF9C3' };

export function Notas() {
  const { puedeEditar } = useAuth();
  const canEdit = puedeEditar('notas');
  const [notas, setNotas]         = useState<Nota[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [editando, setEditando]   = useState<NE|null>(null);
  const [guardando, setGuardando] = useState(false);
  const tituloRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    const { data } = await supabase.from('notas').select('*').order('actualizado_en',{ascending:false});
    setNotas((data as Nota[])??[]); setCargando(false);
  }
  useEffect(() => { cargar(); }, []);
  useEffect(() => { if(editando) tituloRef.current?.focus(); }, [editando?.id]);

  async function guardar() {
    if(!editando)return;
    if(!editando.titulo.trim()&&!editando.contenido.trim()){setEditando(null);return;}
    setGuardando(true);
    if(editando.id){
      const { error } = await supabase.from('notas').update({
        titulo:editando.titulo.trim()||'Sin título', contenido:editando.contenido.trim()||null,
        color:editando.color, actualizado_en:new Date().toISOString(),
      }).eq('id',editando.id);
      if(!error) setNotas(p=>p.map(n=>n.id===editando.id?{...n,titulo:editando.titulo.trim()||'Sin título',contenido:editando.contenido.trim()||null,color:editando.color,actualizado_en:new Date().toISOString()}:n));
    } else {
      const { data, error } = await supabase.from('notas').insert({
        titulo:editando.titulo.trim()||'Sin título', contenido:editando.contenido.trim()||null, color:editando.color,
      }).select().single();
      if(!error&&data) setNotas(p=>[data as Nota,...p]);
    }
    setGuardando(false); setEditando(null);
  }

  async function eliminar(id: string) {
    if(!confirm('¿Eliminar esta nota?'))return;
    await supabase.from('notas').delete().eq('id',id);
    setNotas(p=>p.filter(n=>n.id!==id));
    if(editando?.id===id) setEditando(null);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader num="05 / NOTAS" title="Notas" sub="Apuntes rápidos y pensamientos"
        actions={canEdit && <Btn variant="primary" size="sm" onClick={()=>setEditando({...N0})}>+ Nueva nota</Btn>}
      />

      {/* Modal */}
      {editando && canEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e=>{ if(e.target===e.currentTarget) guardar(); }}>
          <div className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4 shadow-2xl animate-[slideUp_0.15s_ease]"
            style={{ background: editando.color }}>
            <input ref={tituloRef}
              className="w-full bg-transparent border-none border-b border-black/10 outline-none text-base font-semibold text-gray-900 placeholder-gray-500 py-1"
              placeholder="Título"
              value={editando.titulo} onChange={e=>setEditando({...editando,titulo:e.target.value})} />
            <textarea
              className="w-full bg-transparent border-none outline-none resize-y text-sm text-gray-800 placeholder-gray-500 leading-relaxed py-1 min-h-[160px]"
              placeholder="Escribe algo..."
              value={editando.contenido} onChange={e=>setEditando({...editando,contenido:e.target.value})} />
            {/* Paleta */}
            <div className="flex gap-1.5 items-center flex-wrap">
              <span className="text-[10px] text-gray-500 mr-1">Color</span>
              {COLORES.map(c=>(
                <button key={c.valor} title={c.label} onClick={()=>setEditando({...editando,color:c.valor})}
                  className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 shrink-0"
                  style={{ background:c.valor, border:editando.color===c.valor?'2px solid #374151':'1.5px solid rgba(0,0,0,0.15)', outline:editando.color===c.valor?'1px solid #6B7280':undefined }} />
              ))}
            </div>
            <div className="flex justify-between items-center pt-1">
              {editando.id
                ? <button className="text-xs text-rose-600 hover:text-rose-800 cursor-pointer transition-colors" onClick={()=>eliminar(editando.id!)}>Eliminar</button>
                : <div />}
              <div className="flex gap-2">
                <button onClick={()=>setEditando(null)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={guardando}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-gray-100 hover:bg-gray-800 cursor-pointer transition-colors disabled:opacity-50">
                  {guardando?'Guardando...':'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cargando && <p className="text-sm text-gray-600">Cargando...</p>}
      {!cargando && notas.length===0 && <EmptyState message="No hay notas todavía. ¡Crea una!" />}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {notas.map(nota=>(
          <div key={nota.id} onClick={()=>{ if(canEdit) setEditando({id:nota.id,titulo:nota.titulo,contenido:nota.contenido??'',color:nota.color}); }}
            className={`rounded-xl p-4 min-h-[120px] flex flex-col gap-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${canEdit?'cursor-pointer':''}`}
            style={{ background:nota.color, border:'1px solid rgba(0,0,0,0.07)' }}>
            {nota.titulo && <div className="text-sm font-semibold text-gray-900 leading-snug">{nota.titulo}</div>}
            {nota.contenido && <div className="text-xs text-gray-700 leading-relaxed line-clamp-6">{nota.contenido}</div>}
            <div className="mt-auto text-[10px] text-gray-500">
              {new Date(nota.actualizado_en).toLocaleDateString('es',{day:'numeric',month:'short'})}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
