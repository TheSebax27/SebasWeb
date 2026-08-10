import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Rutina, DiaRutina, EjercicioRutina } from '../types';
import { PageHeader, Btn, Field, EmptyState } from '../components/UI';

const FORM_RUTINA = { nombre: '', descripcion: '' };
const FORM_DIA    = { nombre: '' };
const FORM_EJ     = { nombre: '', series: '3', reps: '10', peso_kg: '', notas: '' };

export function Gym() {
  const [rutinas, setRutinas]         = useState<Rutina[]>([]);
  const [rutinaSelId, setRutinaSelId] = useState<string | null>(null);
  const [dias, setDias]               = useState<DiaRutina[]>([]);
  const [diaSelId, setDiaSelId]       = useState<string | null>(null);
  const [ejercicios, setEjercicios]   = useState<EjercicioRutina[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [showFormRutina, setShowFormRutina] = useState(false);
  const [showFormDia, setShowFormDia]       = useState(false);
  const [showFormEj, setShowFormEj]         = useState(false);
  const [formRutina, setFormRutina] = useState(FORM_RUTINA);
  const [formDia, setFormDia]       = useState(FORM_DIA);
  const [formEj, setFormEj]         = useState(FORM_EJ);
  const [guardando, setGuardando]   = useState(false);
  const [editEjId, setEditEjId]     = useState<string | null>(null);
  const [editEjData, setEditEjData] = useState(FORM_EJ);

  async function cargarRutinas() {
    const { data } = await supabase.from('rutinas').select('*').order('creado_en');
    setRutinas((data as Rutina[]) ?? []);
    setCargando(false);
  }

  async function cargarDias(rutId: string) {
    const { data } = await supabase.from('dias_rutina').select('*').eq('rutina_id', rutId).order('orden');
    const lista = (data as DiaRutina[]) ?? [];
    setDias(lista);
    const primero = lista[0]?.id ?? null;
    setDiaSelId(primero);
    if (primero) cargarEjercicios(primero); else setEjercicios([]);
  }

  async function cargarEjercicios(diaId: string) {
    const { data } = await supabase.from('ejercicios_rutina').select('*').eq('dia_id', diaId).order('orden');
    setEjercicios((data as EjercicioRutina[]) ?? []);
  }

  useEffect(() => { cargarRutinas(); }, []);

  function seleccionarRutina(id: string) {
    if (rutinaSelId === id) { setRutinaSelId(null); setDias([]); setEjercicios([]); return; }
    setRutinaSelId(id);
    setShowFormDia(false); setShowFormEj(false); setEditEjId(null);
    cargarDias(id);
  }

  function seleccionarDia(id: string) {
    setDiaSelId(id); setShowFormEj(false); setEditEjId(null); cargarEjercicios(id);
  }

  async function crearRutina() {
    if (!formRutina.nombre.trim()) return;
    setGuardando(true);
    const { data, error } = await supabase.from('rutinas')
      .insert({ nombre: formRutina.nombre.trim(), descripcion: formRutina.descripcion.trim() || null })
      .select().single();
    setGuardando(false);
    if (!error && data) {
      setRutinas(p => [...p, data as Rutina]);
      setFormRutina(FORM_RUTINA); setShowFormRutina(false);
    }
  }

  async function eliminarRutina(id: string) {
    if (!confirm('¿Eliminar esta rutina y todos sus días y ejercicios?')) return;
    await supabase.from('rutinas').delete().eq('id', id);
    setRutinas(p => p.filter(r => r.id !== id));
    if (rutinaSelId === id) { setRutinaSelId(null); setDias([]); setEjercicios([]); }
  }

  async function crearDia() {
    if (!formDia.nombre.trim() || !rutinaSelId) return;
    setGuardando(true);
    const { data, error } = await supabase.from('dias_rutina')
      .insert({ rutina_id: rutinaSelId, nombre: formDia.nombre.trim(), orden: dias.length })
      .select().single();
    setGuardando(false);
    if (!error && data) {
      const nuevo = data as DiaRutina;
      setDias(p => [...p, nuevo]);
      setFormDia(FORM_DIA); setShowFormDia(false);
      seleccionarDia(nuevo.id);
    }
  }

  async function eliminarDia(id: string) {
    if (!confirm('¿Eliminar este día y sus ejercicios?')) return;
    await supabase.from('dias_rutina').delete().eq('id', id);
    const nuevos = dias.filter(d => d.id !== id);
    setDias(nuevos);
    if (diaSelId === id) {
      const primero = nuevos[0]?.id ?? null;
      setDiaSelId(primero);
      if (primero) cargarEjercicios(primero); else setEjercicios([]);
    }
  }

  async function crearEjercicio() {
    if (!formEj.nombre.trim() || !diaSelId) return;
    setGuardando(true);
    const { data, error } = await supabase.from('ejercicios_rutina')
      .insert({
        dia_id: diaSelId, nombre: formEj.nombre.trim(),
        series: parseInt(formEj.series) || 3, reps: formEj.reps.trim() || '10',
        peso_kg: formEj.peso_kg ? parseFloat(formEj.peso_kg) : null,
        notas: formEj.notas.trim() || null, orden: ejercicios.length,
      })
      .select().single();
    setGuardando(false);
    if (!error && data) {
      setEjercicios(p => [...p, data as EjercicioRutina]);
      setFormEj(FORM_EJ); setShowFormEj(false);
    }
  }

  async function eliminarEjercicio(id: string) {
    await supabase.from('ejercicios_rutina').delete().eq('id', id);
    setEjercicios(p => p.filter(e => e.id !== id));
  }

  function iniciarEdicion(ej: EjercicioRutina) {
    setEditEjId(ej.id);
    setEditEjData({ nombre: ej.nombre, series: String(ej.series), reps: ej.reps, peso_kg: ej.peso_kg != null ? String(ej.peso_kg) : '', notas: ej.notas ?? '' });
    setShowFormEj(false);
  }

  async function guardarEdicion(id: string) {
    setGuardando(true);
    const { error } = await supabase.from('ejercicios_rutina').update({
      nombre: editEjData.nombre.trim(), series: parseInt(editEjData.series) || 3,
      reps: editEjData.reps.trim() || '10', peso_kg: editEjData.peso_kg ? parseFloat(editEjData.peso_kg) : null,
      notas: editEjData.notas.trim() || null,
    }).eq('id', id);
    setGuardando(false);
    if (!error) {
      setEjercicios(p => p.map(e => e.id === id ? {
        ...e, nombre: editEjData.nombre.trim(), series: parseInt(editEjData.series) || 3,
        reps: editEjData.reps.trim(), peso_kg: editEjData.peso_kg ? parseFloat(editEjData.peso_kg) : null,
        notas: editEjData.notas.trim() || null,
      } : e));
      setEditEjId(null);
    }
  }

  if (cargando) return <div className="page"><p className="text-sm text-2">Cargando...</p></div>;

  return (
    <div className="page page-wide">
      <PageHeader
        num="04 / GYM"
        title="Gym"
        sub="Rutinas de entrenamiento"
        actions={
          <Btn variant="primary" size="sm" onClick={() => setShowFormRutina(f => !f)}>
            {showFormRutina ? 'Cancelar' : '+ Nueva rutina'}
          </Btn>
        }
      />

      {showFormRutina && (
        <div className="card mb-md flex-col gap-sm" style={{ maxWidth: 440 }}>
          <Field label="Nombre">
            <input className="input" placeholder="Ej. PPL, Full Body..." autoFocus
              value={formRutina.nombre} onChange={e => setFormRutina({ ...formRutina, nombre: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && crearRutina()} />
          </Field>
          <Field label="Descripción (opcional)">
            <input className="input" value={formRutina.descripcion}
              onChange={e => setFormRutina({ ...formRutina, descripcion: e.target.value })} />
          </Field>
          <Btn variant="primary" size="sm" onClick={crearRutina} disabled={guardando}>
            {guardando ? 'Creando...' : 'Crear rutina'}
          </Btn>
        </div>
      )}

      {rutinas.length === 0 && !showFormRutina && (
        <EmptyState message="No hay rutinas. ¡Crea una para empezar!" />
      )}

      <div className="flex-col gap-sm">
        {rutinas.map(r => {
          const sel = r.id === rutinaSelId;
          return (
            <div key={r.id} className={`rutina-card${sel ? ' open' : ''}`}>
              <div className="rutina-header" onClick={() => seleccionarRutina(r.id)}>
                <span className="text-sm text-3">{sel ? '▾' : '▸'}</span>
                <div className="flex-1">
                  <span className="font-600">{r.nombre}</span>
                  {r.descripcion && <span className="text-sm text-2 ml-auto" style={{ marginLeft: '0.6rem' }}>{r.descripcion}</span>}
                </div>
                <Btn variant="danger" size="sm" onClick={e => { e.stopPropagation(); eliminarRutina(r.id); }}>✕</Btn>
              </div>

              {sel && (
                <div className="rutina-body">
                  {/* Tabs de días */}
                  <div className="flex gap-xs flex-wrap items-center mb-md">
                    {dias.map(d => (
                      <button key={d.id} className={`pill-tab${d.id === diaSelId ? ' active' : ''}`}
                        onClick={() => seleccionarDia(d.id)}>
                        {d.nombre}
                      </button>
                    ))}
                    {showFormDia ? (
                      <div className="flex gap-xs items-center">
                        <input className="input" placeholder="Ej: Lunes, Push..." autoFocus
                          style={{ width: 160 }} value={formDia.nombre}
                          onChange={e => setFormDia({ nombre: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && crearDia()} />
                        <Btn variant="primary" size="sm" onClick={crearDia} disabled={guardando}>OK</Btn>
                        <Btn variant="text" size="sm" onClick={() => { setShowFormDia(false); setFormDia(FORM_DIA); }}>✕</Btn>
                      </div>
                    ) : (
                      <button className="pill-tab" onClick={() => setShowFormDia(true)}>+ Día</button>
                    )}
                  </div>

                  {/* Cabecera del día */}
                  {diaSelId && dias.length > 0 && (
                    <div className="flex justify-between items-center mb-sm">
                      <span className="font-500 text-sm text-2">
                        {dias.find(d => d.id === diaSelId)?.nombre}
                      </span>
                      <Btn variant="danger" size="sm" onClick={() => eliminarDia(diaSelId)}>
                        Eliminar día
                      </Btn>
                    </div>
                  )}

                  {/* Ejercicios */}
                  {diaSelId && (
                    <>
                      {ejercicios.length === 0 && (
                        <p className="text-sm text-3 mb-sm">Sin ejercicios todavía.</p>
                      )}

                      <div className="flex-col gap-xs mb-sm">
                        {ejercicios.map((ej, idx) => (
                          <div key={ej.id}>
                            {editEjId === ej.id ? (
                              <div className="inline-form">
                                <Field label="Nombre">
                                  <input className="input" value={editEjData.nombre}
                                    onChange={e => setEditEjData({ ...editEjData, nombre: e.target.value })} />
                                </Field>
                                <div className="flex gap-sm flex-wrap">
                                  <Field label="Series">
                                    <input className="input" type="number" style={{ width: 70 }}
                                      value={editEjData.series} onChange={e => setEditEjData({ ...editEjData, series: e.target.value })} />
                                  </Field>
                                  <Field label="Reps">
                                    <input className="input" placeholder="10 ó 8-12" style={{ width: 90 }}
                                      value={editEjData.reps} onChange={e => setEditEjData({ ...editEjData, reps: e.target.value })} />
                                  </Field>
                                  <Field label="Peso (kg)">
                                    <input className="input" type="number" placeholder="—" style={{ width: 80 }}
                                      value={editEjData.peso_kg} onChange={e => setEditEjData({ ...editEjData, peso_kg: e.target.value })} />
                                  </Field>
                                </div>
                                <Field label="Notas (opcional)">
                                  <input className="input" value={editEjData.notas}
                                    onChange={e => setEditEjData({ ...editEjData, notas: e.target.value })} />
                                </Field>
                                <div className="flex gap-xs">
                                  <Btn variant="primary" size="sm" onClick={() => guardarEdicion(ej.id)} disabled={guardando}>
                                    {guardando ? '...' : 'Guardar'}
                                  </Btn>
                                  <Btn variant="ghost" size="sm" onClick={() => setEditEjId(null)}>Cancelar</Btn>
                                </div>
                              </div>
                            ) : (
                              <div className="ejercicio-row">
                                <div className="ejercicio-num">{idx + 1}</div>
                                <div className="ejercicio-info">
                                  <div className="ejercicio-name">{ej.nombre}</div>
                                  <div className="ejercicio-meta">
                                    {ej.series}×{ej.reps}
                                    {ej.peso_kg != null && <span className="text-accent" style={{ marginLeft: '0.4rem' }}>{ej.peso_kg} kg</span>}
                                    {ej.notas && <span style={{ marginLeft: '0.4rem' }}>· {ej.notas}</span>}
                                  </div>
                                </div>
                                <Btn variant="ghost" size="sm" onClick={() => iniciarEdicion(ej)}>Editar</Btn>
                                <Btn variant="danger" size="sm" onClick={() => eliminarEjercicio(ej.id)}>✕</Btn>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {showFormEj ? (
                        <div className="inline-form">
                          <Field label="Nombre del ejercicio">
                            <input className="input" placeholder="Ej. Press banca" autoFocus
                              value={formEj.nombre} onChange={e => setFormEj({ ...formEj, nombre: e.target.value })} />
                          </Field>
                          <div className="flex gap-sm flex-wrap">
                            <Field label="Series">
                              <input className="input" type="number" style={{ width: 70 }}
                                value={formEj.series} onChange={e => setFormEj({ ...formEj, series: e.target.value })} />
                            </Field>
                            <Field label="Reps">
                              <input className="input" placeholder="10 ó 8-12" style={{ width: 90 }}
                                value={formEj.reps} onChange={e => setFormEj({ ...formEj, reps: e.target.value })} />
                            </Field>
                            <Field label="Peso (kg)">
                              <input className="input" type="number" placeholder="—" style={{ width: 80 }}
                                value={formEj.peso_kg} onChange={e => setFormEj({ ...formEj, peso_kg: e.target.value })} />
                            </Field>
                          </div>
                          <Field label="Notas (opcional)">
                            <input className="input" placeholder="Ej. agarre supino"
                              value={formEj.notas} onChange={e => setFormEj({ ...formEj, notas: e.target.value })} />
                          </Field>
                          <div className="flex gap-xs">
                            <Btn variant="primary" size="sm" onClick={crearEjercicio} disabled={guardando}>
                              {guardando ? 'Agregando...' : 'Agregar'}
                            </Btn>
                            <Btn variant="ghost" size="sm" onClick={() => { setShowFormEj(false); setFormEj(FORM_EJ); }}>
                              Cancelar
                            </Btn>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-ghost w-full" style={{ justifyContent: 'center' }}
                          onClick={() => { setShowFormEj(true); setEditEjId(null); }}>
                          + Agregar ejercicio
                        </button>
                      )}
                    </>
                  )}

                  {!diaSelId && dias.length === 0 && (
                    <p className="text-sm text-3">Agrega un día para empezar a armar la rutina.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
