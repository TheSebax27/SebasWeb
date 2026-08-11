import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Rutina, DiaRutina, EjercicioRutina } from '../types';
import { PageHeader, Btn, Field, EmptyState, inputCls } from '../components/UI';

const FR = { nombre:'', descripcion:'' };
const FD = { nombre:'' };
const FE = { nombre:'', series:'3', reps:'10', peso_kg:'', notas:'' };

export function Gym() {
  const [rutinas, setRutinas]         = useState<Rutina[]>([]);
  const [rutinaSelId, setRutinaSelId] = useState<string|null>(null);
  const [dias, setDias]               = useState<DiaRutina[]>([]);
  const [diaSelId, setDiaSelId]       = useState<string|null>(null);
  const [ejercicios, setEjercicios]   = useState<EjercicioRutina[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [showFR, setShowFR] = useState(false);
  const [showFD, setShowFD] = useState(false);
  const [showFE, setShowFE] = useState(false);
  const [formR, setFormR]   = useState(FR);
  const [formD, setFormD]   = useState(FD);
  const [formE, setFormE]   = useState(FE);
  const [guardando, setGuardando] = useState(false);
  const [editId, setEditId]   = useState<string|null>(null);
  const [editData, setEditData] = useState(FE);

  async function cargarRutinas() {
    const { data } = await supabase.from('rutinas').select('*').order('creado_en');
    setRutinas((data as Rutina[]) ?? []); setCargando(false);
  }
  async function cargarDias(rutId: string) {
    const { data } = await supabase.from('dias_rutina').select('*').eq('rutina_id',rutId).order('orden');
    const lista=(data as DiaRutina[])??[]; setDias(lista);
    const p=lista[0]?.id??null; setDiaSelId(p);
    if(p) cargarEjs(p); else setEjercicios([]);
  }
  async function cargarEjs(diaId: string) {
    const { data } = await supabase.from('ejercicios_rutina').select('*').eq('dia_id',diaId).order('orden');
    setEjercicios((data as EjercicioRutina[]) ?? []);
  }
  useEffect(() => { cargarRutinas(); }, []);

  function selRutina(id: string) {
    if(rutinaSelId===id){setRutinaSelId(null);setDias([]);setEjercicios([]);return;}
    setRutinaSelId(id); setShowFD(false); setShowFE(false); setEditId(null); cargarDias(id);
  }
  function selDia(id: string) { setDiaSelId(id); setShowFE(false); setEditId(null); cargarEjs(id); }

  async function crearRutina() {
    if(!formR.nombre.trim())return;
    setGuardando(true);
    const { data, error } = await supabase.from('rutinas').insert({nombre:formR.nombre.trim(),descripcion:formR.descripcion.trim()||null}).select().single();
    setGuardando(false);
    if(!error&&data){ setRutinas(p=>[...p,data as Rutina]); setFormR(FR); setShowFR(false); }
  }

  async function eliminarRutina(id: string) {
    if(!confirm('¿Eliminar esta rutina y todos sus días y ejercicios?'))return;
    await supabase.from('rutinas').delete().eq('id',id);
    setRutinas(p=>p.filter(r=>r.id!==id));
    if(rutinaSelId===id){setRutinaSelId(null);setDias([]);setEjercicios([]);}
  }

  async function crearDia() {
    if(!formD.nombre.trim()||!rutinaSelId)return;
    setGuardando(true);
    const { data, error } = await supabase.from('dias_rutina').insert({rutina_id:rutinaSelId,nombre:formD.nombre.trim(),orden:dias.length}).select().single();
    setGuardando(false);
    if(!error&&data){ const n=data as DiaRutina; setDias(p=>[...p,n]); setFormD(FD); setShowFD(false); selDia(n.id); }
  }

  async function eliminarDia(id: string) {
    if(!confirm('¿Eliminar este día?'))return;
    await supabase.from('dias_rutina').delete().eq('id',id);
    const nuevos=dias.filter(d=>d.id!==id); setDias(nuevos);
    if(diaSelId===id){ const p=nuevos[0]?.id??null; setDiaSelId(p); if(p) cargarEjs(p); else setEjercicios([]); }
  }

  async function crearEj() {
    if(!formE.nombre.trim()||!diaSelId)return;
    setGuardando(true);
    const { data, error } = await supabase.from('ejercicios_rutina').insert({
      dia_id:diaSelId, nombre:formE.nombre.trim(), series:parseInt(formE.series)||3,
      reps:formE.reps.trim()||'10', peso_kg:formE.peso_kg?parseFloat(formE.peso_kg):null,
      notas:formE.notas.trim()||null, orden:ejercicios.length,
    }).select().single();
    setGuardando(false);
    if(!error&&data){ setEjercicios(p=>[...p,data as EjercicioRutina]); setFormE(FE); setShowFE(false); }
  }

  async function eliminarEj(id: string) {
    await supabase.from('ejercicios_rutina').delete().eq('id',id);
    setEjercicios(p=>p.filter(e=>e.id!==id));
  }

  function iniciarEdit(ej: EjercicioRutina) {
    setEditId(ej.id);
    setEditData({nombre:ej.nombre,series:String(ej.series),reps:ej.reps,peso_kg:ej.peso_kg!=null?String(ej.peso_kg):'',notas:ej.notas??''});
    setShowFE(false);
  }

  async function guardarEdit(id: string) {
    setGuardando(true);
    const { error } = await supabase.from('ejercicios_rutina').update({
      nombre:editData.nombre.trim(), series:parseInt(editData.series)||3,
      reps:editData.reps.trim()||'10', peso_kg:editData.peso_kg?parseFloat(editData.peso_kg):null,
      notas:editData.notas.trim()||null,
    }).eq('id',id);
    setGuardando(false);
    if(!error){ setEjercicios(p=>p.map(e=>e.id===id?{...e,nombre:editData.nombre.trim(),series:parseInt(editData.series)||3,reps:editData.reps.trim(),peso_kg:editData.peso_kg?parseFloat(editData.peso_kg):null,notas:editData.notas.trim()||null}:e)); setEditId(null); }
  }

  if(cargando) return <div className="max-w-4xl mx-auto px-6 py-8"><p className="text-sm text-gray-600">Cargando...</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader num="04 / GYM" title="Gym" sub="Rutinas de entrenamiento"
        actions={<Btn variant="primary" size="sm" onClick={()=>setShowFR(f=>!f)}>{showFR?'Cancelar':'+ Nueva rutina'}</Btn>}
      />

      {showFR && (
        <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 mb-5 flex flex-col gap-4 max-w-sm">
          <Field label="Nombre de la rutina">
            <input className={inputCls} placeholder="Ej. PPL, Full Body..." autoFocus
              value={formR.nombre} onChange={e=>setFormR({...formR,nombre:e.target.value})} onKeyDown={e=>e.key==='Enter'&&crearRutina()} />
          </Field>
          <Field label="Descripción (opcional)">
            <input className={inputCls} value={formR.descripcion} onChange={e=>setFormR({...formR,descripcion:e.target.value})} />
          </Field>
          <Btn variant="primary" size="sm" onClick={crearRutina} disabled={guardando}>{guardando?'Creando...':'Crear'}</Btn>
        </div>
      )}

      {rutinas.length===0&&!showFR && <EmptyState message="No hay rutinas. ¡Crea una para empezar!" />}

      <div className="flex flex-col gap-3">
        {rutinas.map(r=>{
          const sel=r.id===rutinaSelId;
          return (
            <div key={r.id} className={`bg-gray-900/70 backdrop-blur-sm rounded-xl border transition-colors duration-200 overflow-hidden ${sel?'border-emerald-900':'border-gray-800'}`}>
              {/* Rutina header */}
              <div className="flex items-center px-5 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors gap-3" onClick={()=>selRutina(r.id)}>
                <span className="text-xs text-gray-600">{sel?'▾':'▸'}</span>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-100">{r.nombre}</span>
                  {r.descripcion && <span className="ml-2 text-xs text-gray-500">{r.descripcion}</span>}
                </div>
                <Btn variant="danger" size="sm" onClick={e=>{e.stopPropagation();eliminarRutina(r.id);}}>✕</Btn>
              </div>

              {sel && (
                <div className="border-t border-gray-800 px-5 py-5 flex flex-col gap-5">
                  {/* Tabs días */}
                  <div className="flex gap-2 flex-wrap items-center">
                    {dias.map(d=>(
                      <button key={d.id} onClick={()=>selDia(d.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-150 font-medium ${d.id===diaSelId?'bg-emerald-500 border-emerald-500 text-gray-950':'bg-transparent border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}>
                        {d.nombre}
                      </button>
                    ))}
                    {showFD?(
                      <div className="flex gap-2 items-center">
                        <input className={inputCls} placeholder="Ej. Lunes, Push..." autoFocus style={{width:160}}
                          value={formD.nombre} onChange={e=>setFormD({nombre:e.target.value})} onKeyDown={e=>e.key==='Enter'&&crearDia()} />
                        <Btn variant="primary" size="sm" onClick={crearDia} disabled={guardando}>OK</Btn>
                        <Btn variant="text" size="sm" onClick={()=>{setShowFD(false);setFormD(FD);}}>✕</Btn>
                      </div>
                    ):(
                      <button onClick={()=>setShowFD(true)}
                        className="text-xs px-3 py-1.5 rounded-full border border-dashed border-gray-700 text-gray-600 hover:border-gray-600 hover:text-gray-400 cursor-pointer transition-colors">
                        + Día
                      </button>
                    )}
                  </div>

                  {/* Cabecera día */}
                  {diaSelId&&dias.length>0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{dias.find(d=>d.id===diaSelId)?.nombre}</span>
                      <Btn variant="danger" size="sm" onClick={()=>eliminarDia(diaSelId)}>Eliminar día</Btn>
                    </div>
                  )}

                  {/* Ejercicios */}
                  {diaSelId && (
                    <div className="flex flex-col gap-2">
                      {ejercicios.length===0 && <p className="text-xs text-gray-600">Sin ejercicios todavía.</p>}
                      {ejercicios.map((ej,idx)=>(
                        <div key={ej.id}>
                          {editId===ej.id?(
                            <div className="border border-dashed border-emerald-900 bg-emerald-950/20 rounded-xl p-4 flex flex-col gap-3">
                              <Field label="Nombre">
                                <input className={inputCls} value={editData.nombre} onChange={e=>setEditData({...editData,nombre:e.target.value})} />
                              </Field>
                              <div className="flex gap-2 flex-wrap">
                                <Field label="Series"><input className={inputCls} type="number" style={{width:70}} value={editData.series} onChange={e=>setEditData({...editData,series:e.target.value})} /></Field>
                                <Field label="Reps"><input className={inputCls} placeholder="10 ó 8-12" style={{width:90}} value={editData.reps} onChange={e=>setEditData({...editData,reps:e.target.value})} /></Field>
                                <Field label="Peso (kg)"><input className={inputCls} type="number" placeholder="—" style={{width:80}} value={editData.peso_kg} onChange={e=>setEditData({...editData,peso_kg:e.target.value})} /></Field>
                              </div>
                              <Field label="Notas (opcional)"><input className={inputCls} value={editData.notas} onChange={e=>setEditData({...editData,notas:e.target.value})} /></Field>
                              <div className="flex gap-2">
                                <Btn variant="primary" size="sm" onClick={()=>guardarEdit(ej.id)} disabled={guardando}>{guardando?'...':'Guardar'}</Btn>
                                <Btn variant="ghost" size="sm" onClick={()=>setEditId(null)}>Cancelar</Btn>
                              </div>
                            </div>
                          ):(
                            <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">{idx+1}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-100">{ej.nombre}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {ej.series}×{ej.reps}
                                  {ej.peso_kg!=null&&<span className="ml-2 text-emerald-500">{ej.peso_kg} kg</span>}
                                  {ej.notas&&<span className="ml-2">· {ej.notas}</span>}
                                </div>
                              </div>
                              <Btn variant="ghost" size="sm" onClick={()=>iniciarEdit(ej)}>Editar</Btn>
                              <Btn variant="danger" size="sm" onClick={()=>eliminarEj(ej.id)}>✕</Btn>
                            </div>
                          )}
                        </div>
                      ))}

                      {showFE?(
                        <div className="border border-dashed border-emerald-900 bg-emerald-950/20 rounded-xl p-4 flex flex-col gap-3 mt-1">
                          <Field label="Nombre del ejercicio">
                            <input className={inputCls} placeholder="Ej. Press banca" autoFocus value={formE.nombre} onChange={e=>setFormE({...formE,nombre:e.target.value})} />
                          </Field>
                          <div className="flex gap-2 flex-wrap">
                            <Field label="Series"><input className={inputCls} type="number" style={{width:70}} value={formE.series} onChange={e=>setFormE({...formE,series:e.target.value})} /></Field>
                            <Field label="Reps"><input className={inputCls} placeholder="10 ó 8-12" style={{width:90}} value={formE.reps} onChange={e=>setFormE({...formE,reps:e.target.value})} /></Field>
                            <Field label="Peso (kg)"><input className={inputCls} type="number" placeholder="—" style={{width:80}} value={formE.peso_kg} onChange={e=>setFormE({...formE,peso_kg:e.target.value})} /></Field>
                          </div>
                          <Field label="Notas (opcional)"><input className={inputCls} placeholder="Ej. agarre supino" value={formE.notas} onChange={e=>setFormE({...formE,notas:e.target.value})} /></Field>
                          <div className="flex gap-2">
                            <Btn variant="primary" size="sm" onClick={crearEj} disabled={guardando}>{guardando?'...':'Agregar'}</Btn>
                            <Btn variant="ghost" size="sm" onClick={()=>{setShowFE(false);setFormE(FE);}}>Cancelar</Btn>
                          </div>
                        </div>
                      ):(
                        <button className="w-full mt-1 py-2.5 text-xs font-medium text-gray-600 border border-dashed border-gray-800 rounded-lg hover:border-gray-700 hover:text-gray-400 transition-colors cursor-pointer"
                          onClick={()=>{setShowFE(true);setEditId(null);}}>
                          + Agregar ejercicio
                        </button>
                      )}
                    </div>
                  )}
                  {!diaSelId&&dias.length===0 && <p className="text-xs text-gray-600">Agrega un día para empezar a armar la rutina.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
