import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo } from '../types';
import { PageHeader, Btn, EmptyState, ConfirmDialog, Icon, inputCls, textareaCls } from '../components/UI';

interface EditForm { nombre: string; descripcion: string; }

export function Modulos() {
  const { perfil, puedeVerModulo } = useAuth();
  const navigate = useNavigate();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nombre: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);
  const [confirm, setConfirm] = useState<Modulo | null>(null);
  const [eliminando, setEliminando] = useState(false);

  async function cargar() {
    const { data } = await supabase.from('modulos').select('*').order('creado_en', { ascending: false });
    const todos = (data as Modulo[]) ?? [];
    setModulos(todos.filter(m => puedeVerModulo(m.id)));
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  function iniciarEdicion(m: Modulo, e: React.MouseEvent) {
    e.stopPropagation();
    setEditando(m.id);
    setEditForm({ nombre: m.nombre, descripcion: m.descripcion ?? '' });
  }

  async function guardarEdicion(id: string) {
    if (!editForm.nombre.trim()) return;
    setGuardando(true);
    await supabase.from('modulos').update({
      nombre: editForm.nombre.trim(),
      descripcion: editForm.descripcion.trim() || null,
    }).eq('id', id);
    setGuardando(false);
    setEditando(null);
    cargar();
  }

  async function confirmarEliminacion() {
    if (!confirm) return;
    setEliminando(true);
    await supabase.from('modulos').delete().eq('id', confirm.id);
    setEliminando(false);
    setConfirm(null);
    cargar();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader
        num="01 / TABLEROS"
        title="Tableros"
        sub="Galerías de contenido organizado"
        actions={
          perfil?.rol === 'admin' && (
            <Btn variant="primary" size="sm" onClick={() => navigate('/modulos/nuevo')}>+ Nuevo tablero</Btn>
          )
        }
      />

      {cargando ? (
        <p className="text-sm text-gray-600">Cargando...</p>
      ) : modulos.length === 0 ? (
        <EmptyState message="Todavía no hay tableros creados." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modulos.map(m => (
            <div
              key={m.id}
              onClick={() => editando !== m.id && navigate(`/modulos/${m.id}`)}
              className={`group bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 transition-all duration-200 ${editando === m.id ? '' : 'hover:border-gray-700 hover:bg-gray-900/80 cursor-pointer'}`}
            >
              {editando === m.id ? (
                /* ── Modo edición ── */
                <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                  <input
                    className={inputCls}
                    value={editForm.nombre}
                    onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                    placeholder="Nombre"
                    autoFocus
                  />
                  <textarea
                    className={textareaCls}
                    rows={2}
                    value={editForm.descripcion}
                    onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
                    placeholder="Descripción (opcional)"
                  />
                  <div className="flex gap-2">
                    <Btn variant="primary" size="sm" onClick={() => guardarEdicion(m.id)} disabled={guardando}>
                      {guardando ? 'Guardando...' : 'Guardar'}
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setEditando(null)}>Cancelar</Btn>
                  </div>
                </div>
              ) : (
                /* ── Vista normal ── */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors duration-150 truncate">
                        {m.nombre}
                      </div>
                      {m.descripcion && (
                        <div className="mt-1 text-xs text-gray-500 truncate">{m.descripcion}</div>
                      )}
                    </div>
                    {perfil?.rol === 'admin' && (
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => iniciarEdicion(m, e)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Icon.Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setConfirm(m); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Icon.Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-[10px] text-gray-700">
                    {new Date(m.creado_en).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={`Eliminar "${confirm?.nombre}"`}
        message="Se eliminará el tablero y todas sus fotos permanentemente. Esta acción no se puede deshacer."
        onConfirm={confirmarEliminacion}
        onCancel={() => setConfirm(null)}
        confirmLabel={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
      />
    </div>
  );
}
