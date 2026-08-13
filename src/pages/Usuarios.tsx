import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Perfil, Rol, Modulo, PermisosUsuario, PERMISOS_DEFAULT } from '../types';
import { PageHeader, Btn, Field, Badge, EmptyState, inputCls, selectCls } from '../components/UI';

type SeccionKey = keyof PermisosUsuario['pestanas'];

const SECCIONES: { key: SeccionKey; label: string; emoji: string }[] = [
  { key: 'galeria',         label: 'Tableros',        emoji: '🗂️' },
  { key: 'finanzas',        label: 'Finanzas',        emoji: '💰' },
  { key: 'metas',           label: 'Metas',           emoji: '🎯' },
  { key: 'gym',             label: 'Gym',             emoji: '🏋️' },
  { key: 'notas',           label: 'Notas',           emoji: '📝' },
  { key: 'entretenimiento', label: 'Entretenimiento', emoji: '🎬' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${value ? 'bg-emerald-500' : 'bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function resolverPermisos(p: Perfil): PermisosUsuario {
  if (!p.permisos) return { ...PERMISOS_DEFAULT };
  return {
    pestanas: { ...PERMISOS_DEFAULT.pestanas, ...p.permisos.pestanas },
    modulos_todos: p.permisos.modulos_todos ?? true,
    modulos_ids: p.permisos.modulos_ids ?? [],
  };
}

export function Usuarios() {
  const [usuarios,     setUsuarios]     = useState<Perfil[]>([]);
  const [modulos,      setModulos]      = useState<Modulo[]>([]);
  const [editandoId,   setEditandoId]   = useState<string | null>(null);
  const [permEdit,     setPermEdit]     = useState<PermisosUsuario>(PERMISOS_DEFAULT);
  const [guardandoPerm,setGuardandoPerm]= useState(false);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [nombre,   setNombre]   = useState('');
  const [rol,      setRol]      = useState<Rol>('visualizador');
  const [error,    setError]    = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    const [{ data: u }, { data: m }] = await Promise.all([
      supabase.from('perfiles').select('*').order('creado_en'),
      supabase.from('modulos').select('id, nombre').order('nombre'),
    ]);
    setUsuarios((u as Perfil[]) ?? []);
    setModulos((m as Modulo[]) ?? []);
  }
  useEffect(() => { cargar(); }, []);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null); setEnviando(true);
    const { error } = await supabase.functions.invoke('crear-usuario', {
      body: { email, password, nombre, rol },
    });
    setEnviando(false);
    if (error) { setError('No se pudo crear el usuario'); return; }
    setEmail(''); setPassword(''); setNombre(''); setRol('visualizador');
    setMostrarForm(false); cargar();
  }

  function abrirPermisos(u: Perfil) {
    if (editandoId === u.id) { setEditandoId(null); return; }
    setEditandoId(u.id);
    setPermEdit(resolverPermisos(u));
  }

  async function guardarPermisos(userId: string) {
    setGuardandoPerm(true);
    await supabase.from('perfiles').update({ permisos: permEdit }).eq('id', userId);
    setGuardandoPerm(false);
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, permisos: permEdit } : u));
    setEditandoId(null);
  }

  function setPestana(key: SeccionKey, val: boolean) {
    setPermEdit(p => ({ ...p, pestanas: { ...p.pestanas, [key]: val } }));
  }

  function toggleModulo(id: string) {
    setPermEdit(p => {
      const ids = p.modulos_ids.includes(id)
        ? p.modulos_ids.filter(x => x !== id)
        : [...p.modulos_ids, id];
      return { ...p, modulos_ids: ids };
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader num="07 / USUARIOS" title="Usuarios" sub="Gestión de accesos y permisos"
        actions={
          <Btn variant="primary" size="sm" onClick={() => setMostrarForm(f => !f)}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo usuario'}
          </Btn>
        }
      />

      {mostrarForm && (
        <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6 max-w-md">
          <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
            <Field label="Nombre">
              <input className={inputCls} value={nombre} onChange={e => setNombre(e.target.value)} />
            </Field>
            <Field label="Correo">
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </Field>
            <Field label="Contraseña temporal">
              <input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </Field>
            <Field label="Rol">
              <select className={selectCls} value={rol} onChange={e => setRol(e.target.value as Rol)}>
                <option value="visualizador">Visualizador</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <Btn variant="primary" type="submit" disabled={enviando}>
              {enviando ? 'Creando...' : 'Crear usuario'}
            </Btn>
          </form>
        </div>
      )}

      {usuarios.length === 0 ? (
        <EmptyState message="No hay usuarios registrados." />
      ) : (
        <div className="flex flex-col gap-3">
          {usuarios.map(u => {
            const esAdmin = u.rol === 'admin';
            const abierto = editandoId === u.id;

            return (
              <div key={u.id} className={`bg-gray-900/70 backdrop-blur-sm border rounded-xl overflow-hidden transition-colors ${abierto ? 'border-emerald-900' : 'border-gray-800'}`}>
                {/* Fila principal */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-900 flex items-center justify-center text-sm font-semibold text-emerald-400 shrink-0">
                    {(u.nombre ?? u.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-100">{u.nombre ?? '—'}</span>
                      <Badge variant={esAdmin ? 'success' : 'neutral'}>{u.rol}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  {!esAdmin && (
                    <Btn variant="ghost" size="sm" onClick={() => abrirPermisos(u)}>
                      {abierto ? 'Cerrar' : 'Permisos'}
                    </Btn>
                  )}
                  {esAdmin && (
                    <span className="text-[10px] text-gray-600 font-medium">Acceso total</span>
                  )}
                </div>

                {/* Panel de permisos (solo visualizadores) */}
                {abierto && !esAdmin && (
                  <div className="border-t border-gray-800 px-4 py-4 flex flex-col gap-5">
                    {/* Secciones */}
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-3">Secciones visibles</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SECCIONES.map(s => (
                          <div key={s.key} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-300 flex items-center gap-1.5">
                              <span>{s.emoji}</span>{s.label}
                            </span>
                            <Toggle value={permEdit.pestanas[s.key]} onChange={v => setPestana(s.key, v)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Módulos */}
                    {permEdit.pestanas.galeria && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Tableros accesibles</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500">Todos</span>
                            <Toggle value={permEdit.modulos_todos} onChange={v => setPermEdit(p => ({ ...p, modulos_todos: v }))} />
                          </div>
                        </div>
                        {!permEdit.modulos_todos && (
                          <div className="flex flex-wrap gap-2">
                            {modulos.length === 0 && <p className="text-xs text-gray-600">Sin tableros creados.</p>}
                            {modulos.map(m => {
                              const sel = permEdit.modulos_ids.includes(m.id);
                              return (
                                <button key={m.id} type="button" onClick={() => toggleModulo(m.id)}
                                  className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all ${sel ? 'bg-emerald-950 border-emerald-700 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}>
                                  {m.nombre}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {!permEdit.modulos_todos && permEdit.modulos_ids.length === 0 && (
                          <p className="text-xs text-amber-500 mt-1">⚠ Sin tableros seleccionados → no verá ninguno.</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1 border-t border-gray-800">
                      <Btn variant="primary" size="sm" onClick={() => guardarPermisos(u.id)} disabled={guardandoPerm}>
                        {guardandoPerm ? 'Guardando...' : 'Guardar permisos'}
                      </Btn>
                      <Btn variant="ghost" size="sm" onClick={() => setEditandoId(null)}>Cancelar</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
