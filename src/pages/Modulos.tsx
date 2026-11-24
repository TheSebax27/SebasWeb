import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Modulo } from '../types';
import { PageHeader, Btn, EmptyState, ConfirmDialog, Icon, inputCls, textareaCls } from '../components/UI';

const POR_PAGINA = 10;

interface EditForm { nombre: string; descripcion: string; }

export function Modulos() {
  const { perfil, puedeVerModulo, puedeEditar } = useAuth();
  const canEdit = puedeEditar('galeria');
  const navigate = useNavigate();

  const [modulos,   setModulos]   = useState<Modulo[]>([]);
  const [conteos,   setConteos]   = useState<Record<string, number>>({});
  const [cargando,  setCargando]  = useState(true);
  const [pagina,    setPagina]    = useState(0);        // 0-indexed
  const [total,     setTotal]     = useState(0);

  const [editando,  setEditando]  = useState<string | null>(null);
  const [editForm,  setEditForm]  = useState<EditForm>({ nombre: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);
  const [confirm,   setConfirm]   = useState<Modulo | null>(null);
  const [eliminando,setEliminando]= useState(false);

  async function cargar(pag = pagina) {
    setCargando(true);
    const desde = pag * POR_PAGINA;
    const hasta  = desde + POR_PAGINA - 1;

    const { data, count } = await supabase
      .from('modulos')
      .select('*, submodulos(count)', { count: 'exact' })
      .order('creado_en', { ascending: false })
      .range(desde, hasta);

    const todos = (data as (Modulo & { submodulos: { count: number }[] })[]) ?? [];
    setModulos(todos.filter(m => puedeVerModulo(m.id)) as Modulo[]);
    setConteos(prev => ({
      ...prev,
      ...Object.fromEntries(todos.map(m => [m.id, m.submodulos?.[0]?.count ?? 0])),
    }));
    setTotal(count ?? 0);
    setCargando(false);
  }

  useEffect(() => { cargar(pagina); }, [pagina]);

  const totalPaginas = Math.ceil(total / POR_PAGINA);

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
    // Si eliminamos el último de la página, retroceder
    if (modulos.length === 1 && pagina > 0) {
      setPagina(p => p - 1);
    } else {
      cargar();
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader
        num="01 / TABLEROS"
        title="Tableros"
        sub="Galerías de contenido organizado"
        actions={
          canEdit && (
            <Btn variant="primary" size="sm" onClick={() => navigate('/modulos/nuevo')}>+ Nuevo tablero</Btn>
          )
        }
      />

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 h-24" />
          ))}
        </div>
      ) : modulos.length === 0 ? (
        <EmptyState message="Todavía no hay tableros creados." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modulos.map(m => (
              <div
                key={m.id}
                onClick={() => editando !== m.id && navigate(`/modulos/${m.id}`)}
                className={`group bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 transition-all duration-200 ${editando === m.id ? '' : 'hover:border-gray-700 hover:bg-gray-900/80 cursor-pointer'}`}
              >
                {editando === m.id ? (
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
                      {canEdit && (
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
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-gray-700">
                        {new Date(m.creado_en).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-medium text-gray-600">
                        {conteos[m.id] ?? 0} sub-tablero{(conteos[m.id] ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/60">
              <span className="text-xs text-gray-600">
                {pagina * POR_PAGINA + 1}–{Math.min((pagina + 1) * POR_PAGINA, total)} de {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina(p => p - 1)}
                  disabled={pagina === 0}
                  className="w-8 h-8 rounded-lg border border-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ‹
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPaginas }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPagina(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        i === pagina
                          ? 'bg-gray-800 text-gray-100'
                          : 'text-gray-600 hover:text-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPagina(p => p + 1)}
                  disabled={pagina >= totalPaginas - 1}
                  className="w-8 h-8 rounded-lg border border-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
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
