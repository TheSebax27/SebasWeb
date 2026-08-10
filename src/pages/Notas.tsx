import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
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

interface NotaEditando { id: string | null; titulo: string; contenido: string; color: string; }
const NOTA0: NotaEditando = { id: null, titulo: '', contenido: '', color: '#FEF9C3' };

export function Notas() {
  const [notas, setNotas]         = useState<Nota[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [editando, setEditando]   = useState<NotaEditando | null>(null);
  const [guardando, setGuardando] = useState(false);
  const tituloRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    const { data } = await supabase.from('notas').select('*').order('actualizado_en', { ascending: false });
    setNotas((data as Nota[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);
  useEffect(() => { if (editando) tituloRef.current?.focus(); }, [editando?.id]);

  async function guardar() {
    if (!editando) return;
    if (!editando.titulo.trim() && !editando.contenido.trim()) { setEditando(null); return; }
    setGuardando(true);

    if (editando.id) {
      const { error } = await supabase.from('notas').update({
        titulo: editando.titulo.trim() || 'Sin título',
        contenido: editando.contenido.trim() || null,
        color: editando.color,
        actualizado_en: new Date().toISOString(),
      }).eq('id', editando.id);
      if (!error) setNotas(p => p.map(n => n.id === editando.id
        ? { ...n, titulo: editando.titulo.trim() || 'Sin título', contenido: editando.contenido.trim() || null, color: editando.color, actualizado_en: new Date().toISOString() }
        : n));
    } else {
      const { data, error } = await supabase.from('notas').insert({
        titulo: editando.titulo.trim() || 'Sin título',
        contenido: editando.contenido.trim() || null,
        color: editando.color,
      }).select().single();
      if (!error && data) setNotas(p => [data as Nota, ...p]);
    }

    setGuardando(false);
    setEditando(null);
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta nota?')) return;
    await supabase.from('notas').delete().eq('id', id);
    setNotas(p => p.filter(n => n.id !== id));
    if (editando?.id === id) setEditando(null);
  }

  return (
    <div className="page page-wide">
      <PageHeader
        num="05 / NOTAS"
        title="Notas"
        sub="Apuntes rápidos y pensamientos"
        actions={
          <Btn variant="primary" size="sm" onClick={() => setEditando({ ...NOTA0 })}>
            + Nueva nota
          </Btn>
        }
      />

      {/* Modal editor */}
      {editando && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) guardar(); }}>
          <div className="modal" style={{ background: editando.color }}>
            <input
              ref={tituloRef}
              className="input"
              placeholder="Título"
              value={editando.titulo}
              onChange={e => setEditando({ ...editando, titulo: e.target.value })}
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.12)', borderRadius: 0, fontWeight: 600, fontSize: '16px', outline: 'none', padding: '0.25rem 0' }}
            />

            <textarea
              className="textarea-input"
              placeholder="Escribe algo..."
              value={editando.contenido}
              onChange={e => setEditando({ ...editando, contenido: e.target.value })}
              rows={8}
              style={{ background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', fontSize: '14px', padding: '0.25rem 0', boxShadow: 'none' }}
            />

            <div className="flex gap-xs items-center flex-wrap">
              <span className="text-xs text-2 mr-xs">Color</span>
              {COLORES.map(c => (
                <button
                  key={c.valor}
                  title={c.label}
                  className={`color-swatch${editando.color === c.valor ? ' active' : ''}`}
                  style={{ background: c.valor, border: editando.color === c.valor ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.15)' }}
                  onClick={() => setEditando({ ...editando, color: c.valor })}
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              {editando.id ? (
                <Btn variant="danger" size="sm" onClick={() => eliminar(editando.id!)}>Eliminar</Btn>
              ) : <div />}
              <div className="flex gap-xs">
                <Btn variant="ghost" size="sm" onClick={() => setEditando(null)}>Cancelar</Btn>
                <Btn variant="primary" size="sm" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {cargando && <p className="text-sm text-2">Cargando...</p>}
      {!cargando && notas.length === 0 && <EmptyState message="No hay notas todavía. ¡Crea una!" />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
        {notas.map(nota => (
          <div key={nota.id} className="note-card" style={{ background: nota.color }} onClick={() => setEditando({ id: nota.id, titulo: nota.titulo, contenido: nota.contenido ?? '', color: nota.color })}>
            {nota.titulo && <div className="note-card-title">{nota.titulo}</div>}
            {nota.contenido && <div className="note-card-body">{nota.contenido}</div>}
            <div className="note-card-date">
              {new Date(nota.actualizado_en).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
