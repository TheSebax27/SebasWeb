import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Rutina, DiaRutina, EjercicioRutina } from '../types';

// ── formularios vacíos ──────────────────────────────────────
const FORM_RUTINA  = { nombre: '', descripcion: '' };
const FORM_DIA     = { nombre: '' };
const FORM_EJ      = { nombre: '', series: '3', reps: '10', peso_kg: '', notas: '' };

// ── helpers de UI ───────────────────────────────────────────
function Pill({
  activo, onClick, children,
}: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.35rem 0.85rem',
        borderRadius: 20,
        cursor: 'pointer',
        border: activo ? '1px solid #1a73e8' : '1px solid #ddd',
        background: activo ? '#e8f0fe' : 'transparent',
        color: activo ? '#1a73e8' : 'inherit',
        fontWeight: activo ? 600 : 400,
        fontSize: '0.875rem',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export function Gym() {
  const [rutinas, setRutinas]         = useState<Rutina[]>([]);
  const [rutinaSelId, setRutinaSelId] = useState<string | null>(null);
  const [dias, setDias]               = useState<DiaRutina[]>([]);
  const [diaSelId, setDiaSelId]       = useState<string | null>(null);
  const [ejercicios, setEjercicios]   = useState<EjercicioRutina[]>([]);
  const [cargando, setCargando]       = useState(true);

  // formularios
  const [showFormRutina, setShowFormRutina] = useState(false);
  const [showFormDia,    setShowFormDia]    = useState(false);
  const [showFormEj,     setShowFormEj]     = useState(false);
  const [formRutina, setFormRutina] = useState(FORM_RUTINA);
  const [formDia,    setFormDia]    = useState(FORM_DIA);
  const [formEj,     setFormEj]     = useState(FORM_EJ);
  const [guardando, setGuardando]   = useState(false);

  // edición inline de ejercicio
  const [editEjId, setEditEjId]   = useState<string | null>(null);
  const [editEjData, setEditEjData] = useState(FORM_EJ);

  // ── carga ────────────────────────────────────────────────
  async function cargarRutinas() {
    const { data } = await supabase
      .from('rutinas')
      .select('*')
      .order('creado_en');
    setRutinas((data as Rutina[]) ?? []);
    setCargando(false);
  }

  async function cargarDias(rutId: string) {
    const { data } = await supabase
      .from('dias_rutina')
      .select('*')
      .eq('rutina_id', rutId)
      .order('orden');
    const lista = (data as DiaRutina[]) ?? [];
    setDias(lista);
    const primero = lista[0]?.id ?? null;
    setDiaSelId(primero);
    if (primero) cargarEjercicios(primero);
    else setEjercicios([]);
  }

  async function cargarEjercicios(diaId: string) {
    const { data } = await supabase
      .from('ejercicios_rutina')
      .select('*')
      .eq('dia_id', diaId)
      .order('orden');
    setEjercicios((data as EjercicioRutina[]) ?? []);
  }

  useEffect(() => { cargarRutinas(); }, []);

  // ── selección de rutina ──────────────────────────────────
  function seleccionarRutina(id: string) {
    if (rutinaSelId === id) { setRutinaSelId(null); setDias([]); setEjercicios([]); return; }
    setRutinaSelId(id);
    setShowFormDia(false);
    setShowFormEj(false);
    setEditEjId(null);
    cargarDias(id);
  }

  function seleccionarDia(id: string) {
    setDiaSelId(id);
    setShowFormEj(false);
    setEditEjId(null);
    cargarEjercicios(id);
  }

  // ── crear rutina ─────────────────────────────────────────
  async function crearRutina() {
    if (!formRutina.nombre.trim()) return;
    setGuardando(true);
    const { data, error } = await supabase
      .from('rutinas')
      .insert({ nombre: formRutina.nombre.trim(), descripcion: formRutina.descripcion.trim() || null })
      .select().single();
    setGuardando(false);
    if (!error && data) {
      setRutinas((p) => [...p, data as Rutina]);
      setFormRutina(FORM_RUTINA);
      setShowFormRutina(false);
    }
  }

  async function eliminarRutina(id: string) {
    if (!confirm('¿Eliminar esta rutina y todos sus días y ejercicios?')) return;
    await supabase.from('rutinas').delete().eq('id', id);
    setRutinas((p) => p.filter((r) => r.id !== id));
    if (rutinaSelId === id) { setRutinaSelId(null); setDias([]); setEjercicios([]); }
  }

  // ── crear día ────────────────────────────────────────────
  async function crearDia() {
    if (!formDia.nombre.trim() || !rutinaSelId) return;
    setGuardando(true);
    const { data, error } = await supabase
      .from('dias_rutina')
      .insert({ rutina_id: rutinaSelId, nombre: formDia.nombre.trim(), orden: dias.length })
      .select().single();
    setGuardando(false);
    if (!error && data) {
      const nuevo = data as DiaRutina;
      setDias((p) => [...p, nuevo]);
      setFormDia(FORM_DIA);
      setShowFormDia(false);
      seleccionarDia(nuevo.id);
    }
  }

  async function eliminarDia(id: string) {
    if (!confirm('¿Eliminar este día y sus ejercicios?')) return;
    await supabase.from('dias_rutina').delete().eq('id', id);
    const nuevos = dias.filter((d) => d.id !== id);
    setDias(nuevos);
    if (diaSelId === id) {
      const primero = nuevos[0]?.id ?? null;
      setDiaSelId(primero);
      if (primero) cargarEjercicios(primero); else setEjercicios([]);
    }
  }

  // ── crear ejercicio ──────────────────────────────────────
  async function crearEjercicio() {
    if (!formEj.nombre.trim() || !diaSelId) return;
    setGuardando(true);
    const { data, error } = await supabase
      .from('ejercicios_rutina')
      .insert({
        dia_id:  diaSelId,
        nombre:  formEj.nombre.trim(),
        series:  parseInt(formEj.series) || 3,
        reps:    formEj.reps.trim() || '10',
        peso_kg: formEj.peso_kg ? parseFloat(formEj.peso_kg) : null,
        notas:   formEj.notas.trim() || null,
        orden:   ejercicios.length,
      })
      .select().single();
    setGuardando(false);
    if (!error && data) {
      setEjercicios((p) => [...p, data as EjercicioRutina]);
      setFormEj(FORM_EJ);
      setShowFormEj(false);
    }
  }

  async function eliminarEjercicio(id: string) {
    await supabase.from('ejercicios_rutina').delete().eq('id', id);
    setEjercicios((p) => p.filter((e) => e.id !== id));
  }

  // ── editar ejercicio ─────────────────────────────────────
  function iniciarEdicion(ej: EjercicioRutina) {
    setEditEjId(ej.id);
    setEditEjData({
      nombre: ej.nombre,
      series: String(ej.series),
      reps: ej.reps,
      peso_kg: ej.peso_kg != null ? String(ej.peso_kg) : '',
      notas: ej.notas ?? '',
    });
    setShowFormEj(false);
  }

  async function guardarEdicion(id: string) {
    setGuardando(true);
    const { error } = await supabase.from('ejercicios_rutina').update({
      nombre:  editEjData.nombre.trim(),
      series:  parseInt(editEjData.series) || 3,
      reps:    editEjData.reps.trim() || '10',
      peso_kg: editEjData.peso_kg ? parseFloat(editEjData.peso_kg) : null,
      notas:   editEjData.notas.trim() || null,
    }).eq('id', id);
    setGuardando(false);
    if (!error) {
      setEjercicios((p) => p.map((e) => e.id === id ? {
        ...e,
        nombre: editEjData.nombre.trim(),
        series: parseInt(editEjData.series) || 3,
        reps: editEjData.reps.trim(),
        peso_kg: editEjData.peso_kg ? parseFloat(editEjData.peso_kg) : null,
        notas: editEjData.notas.trim() || null,
      } : e));
      setEditEjId(null);
    }
  }

  // ── render ───────────────────────────────────────────────
  if (cargando) return <p style={{ padding: '1rem' }}>Cargando...</p>;

  const rutinaActual = rutinas.find((r) => r.id === rutinaSelId) ?? null;

  return (
    <div style={{ padding: '1rem', maxWidth: 820, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0 }}>Gym</h1>
        <button
          onClick={() => { setShowFormRutina(!showFormRutina); }}
          style={{ padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}
        >
          {showFormRutina ? 'Cancelar' : '+ Nueva rutina'}
        </button>
      </div>

      {/* Form nueva rutina */}
      {showFormRutina && (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 440 }}>
          <input
            placeholder="Nombre de la rutina (ej: PPL, Full Body…) *"
            value={formRutina.nombre}
            onChange={(e) => setFormRutina({ ...formRutina, nombre: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && crearRutina()}
            autoFocus
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <input
            placeholder="Descripción (opcional)"
            value={formRutina.descripcion}
            onChange={(e) => setFormRutina({ ...formRutina, descripcion: e.target.value })}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            onClick={crearRutina}
            disabled={guardando}
            style={{ padding: '0.45rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}
          >
            {guardando ? 'Creando…' : 'Crear'}
          </button>
        </div>
      )}

      {/* Lista de rutinas */}
      {rutinas.length === 0 && !showFormRutina && (
        <p style={{ color: '#888' }}>No hay rutinas. ¡Crea una para empezar!</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: rutinaSelId ? '1.5rem' : 0 }}>
        {rutinas.map((r) => {
          const sel = r.id === rutinaSelId;
          return (
            <div
              key={r.id}
              style={{
                border: `1px solid ${sel ? '#1a73e8' : '#e0e0e0'}`,
                borderRadius: 10,
                overflow: 'hidden',
                background: sel ? '#f8fbff' : '#fff',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', gap: '0.75rem' }}
                onClick={() => seleccionarRutina(r.id)}
              >
                <span style={{ fontSize: '1.1rem' }}>{sel ? '▾' : '▸'}</span>
                <div style={{ flex: 1 }}>
                  <strong>{r.nombre}</strong>
                  {r.descripcion && <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>{r.descripcion}</span>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); eliminarRutina(r.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '1rem', padding: '0 0.25rem' }}
                  title="Eliminar rutina"
                >
                  ✕
                </button>
              </div>

              {/* Detalle de la rutina seleccionada */}
              {sel && (
                <div style={{ borderTop: '1px solid #e8f0fe', padding: '1rem' }}>

                  {/* Tabs de días */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
                    {dias.map((d) => (
                      <div key={d.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Pill activo={d.id === diaSelId} onClick={() => seleccionarDia(d.id)}>
                          {d.nombre}
                        </Pill>
                        <button
                          onClick={() => eliminarDia(d.id)}
                          style={{ position: 'absolute', top: -6, right: -6, background: '#e0e0e0', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', fontSize: 9, lineHeight: '16px', padding: 0, display: 'none' }}
                          className="del-dia"
                        >✕</button>
                      </div>
                    ))}

                    {/* Form nuevo día inline */}
                    {showFormDia ? (
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <input
                          placeholder="Ej: Lunes, Día A, Push…"
                          value={formDia.nombre}
                          onChange={(e) => setFormDia({ nombre: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && crearDia()}
                          autoFocus
                          style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem', width: 160 }}
                        />
                        <button onClick={crearDia} disabled={guardando}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', fontSize: '0.85rem' }}>
                          {guardando ? '…' : 'OK'}
                        </button>
                        <button onClick={() => { setShowFormDia(false); setFormDia(FORM_DIA); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowFormDia(true)}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 20, border: '1px dashed #aaa', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: '#666' }}
                      >
                        + Día
                      </button>
                    )}
                  </div>

                  {/* Eliminar día seleccionado */}
                  {diaSelId && dias.length > 0 && (
                    <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#444' }}>
                        {dias.find((d) => d.id === diaSelId)?.nombre}
                      </strong>
                      <button
                        onClick={() => eliminarDia(diaSelId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#dc2626' }}
                      >
                        Eliminar día
                      </button>
                    </div>
                  )}

                  {/* Ejercicios del día */}
                  {diaSelId && (
                    <>
                      {ejercicios.length === 0 && (
                        <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>Sin ejercicios todavía.</p>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {ejercicios.map((ej, idx) => (
                          <div key={ej.id} style={{ background: '#f8f9fa', borderRadius: 8, padding: '0.65rem 0.85rem' }}>

                            {editEjId === ej.id ? (
                              /* Modo edición */
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input
                                  value={editEjData.nombre}
                                  onChange={(e) => setEditEjData({ ...editEjData, nombre: e.target.value })}
                                  placeholder="Nombre del ejercicio"
                                  style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.9rem' }}
                                />
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75rem', color: '#666' }}>
                                    Series
                                    <input type="number" value={editEjData.series}
                                      onChange={(e) => setEditEjData({ ...editEjData, series: e.target.value })}
                                      style={{ width: 64, padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75rem', color: '#666' }}>
                                    Reps
                                    <input value={editEjData.reps}
                                      onChange={(e) => setEditEjData({ ...editEjData, reps: e.target.value })}
                                      placeholder="10 o 8-12"
                                      style={{ width: 80, padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75rem', color: '#666' }}>
                                    Peso (kg)
                                    <input type="number" value={editEjData.peso_kg}
                                      onChange={(e) => setEditEjData({ ...editEjData, peso_kg: e.target.value })}
                                      placeholder="—"
                                      style={{ width: 72, padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc' }} />
                                  </label>
                                </div>
                                <input value={editEjData.notas}
                                  onChange={(e) => setEditEjData({ ...editEjData, notas: e.target.value })}
                                  placeholder="Notas (opcional)"
                                  style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }} />
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => guardarEdicion(ej.id)} disabled={guardando}
                                    style={{ padding: '0.3rem 0.7rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', fontSize: '0.85rem' }}>
                                    {guardando ? '…' : 'Guardar'}
                                  </button>
                                  <button onClick={() => setEditEjId(null)}
                                    style={{ padding: '0.3rem 0.7rem', borderRadius: 6, cursor: 'pointer', border: '1px solid #ccc', background: 'transparent', fontSize: '0.85rem' }}>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Vista normal */
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, fontWeight: 600 }}>
                                  {idx + 1}
                                </span>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontWeight: 600 }}>{ej.nombre}</span>
                                  <span style={{ marginLeft: '0.6rem', fontSize: '0.85rem', color: '#555' }}>
                                    {ej.series}×{ej.reps}
                                    {ej.peso_kg != null && <span style={{ marginLeft: '0.4rem', color: '#1a73e8' }}>{ej.peso_kg} kg</span>}
                                  </span>
                                  {ej.notas && <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#888' }}>{ej.notas}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                  <button onClick={() => iniciarEdicion(ej)}
                                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', padding: '0.2rem 0.5rem', color: '#555' }}>
                                    Editar
                                  </button>
                                  <button onClick={() => eliminarEjercicio(ej.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '1rem' }}>✕</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Form nuevo ejercicio */}
                      {showFormEj ? (
                        <div style={{ border: '1px dashed #1a73e8', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input
                            placeholder="Nombre del ejercicio *"
                            value={formEj.nombre}
                            onChange={(e) => setFormEj({ ...formEj, nombre: e.target.value })}
                            autoFocus
                            style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75rem', color: '#666' }}>
                              Series
                              <input type="number" value={formEj.series}
                                onChange={(e) => setFormEj({ ...formEj, series: e.target.value })}
                                style={{ width: 64, padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc' }} />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75rem', color: '#666' }}>
                              Reps
                              <input value={formEj.reps}
                                onChange={(e) => setFormEj({ ...formEj, reps: e.target.value })}
                                placeholder="10 ó 8-12"
                                style={{ width: 80, padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc' }} />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75rem', color: '#666' }}>
                              Peso (kg)
                              <input type="number" value={formEj.peso_kg}
                                onChange={(e) => setFormEj({ ...formEj, peso_kg: e.target.value })}
                                placeholder="—"
                                style={{ width: 72, padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc' }} />
                            </label>
                          </div>
                          <input
                            placeholder="Notas (opcional, ej: agarre supino)"
                            value={formEj.notas}
                            onChange={(e) => setFormEj({ ...formEj, notas: e.target.value })}
                            style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={crearEjercicio} disabled={guardando}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', fontSize: '0.85rem' }}>
                              {guardando ? 'Agregando…' : 'Agregar'}
                            </button>
                            <button onClick={() => { setShowFormEj(false); setFormEj(FORM_EJ); }}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: 6, cursor: 'pointer', border: '1px solid #ccc', background: 'transparent', fontSize: '0.85rem' }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setShowFormEj(true); setEditEjId(null); }}
                          style={{ padding: '0.4rem 0.85rem', borderRadius: 6, border: '1px dashed #aaa', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: '#555', width: '100%' }}
                        >
                          + Agregar ejercicio
                        </button>
                      )}
                    </>
                  )}

                  {!diaSelId && dias.length === 0 && (
                    <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Agrega un día para empezar a armar la rutina.</p>
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
