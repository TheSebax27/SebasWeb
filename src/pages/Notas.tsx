import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Nota } from '../types';

const COLORES = [
  { valor: '#ffffff', label: 'Blanco' },
  { valor: '#fef9c3', label: 'Amarillo' },
  { valor: '#dcfce7', label: 'Verde' },
  { valor: '#dbeafe', label: 'Azul' },
  { valor: '#fce7f3', label: 'Rosa' },
  { valor: '#ede9fe', label: 'Violeta' },
  { valor: '#ffedd5', label: 'Naranja' },
  { valor: '#f1f5f9', label: 'Gris' },
];

interface NotaEditando {
  id: string | null; // null = nueva
  titulo: string;
  contenido: string;
  color: string;
}

const NOTA_VACIA: NotaEditando = { id: null, titulo: '', contenido: '', color: '#fef9c3' };

export function Notas() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<NotaEditando | null>(null);
  const [guardando, setGuardando] = useState(false);
  const tituloRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    const { data } = await supabase
      .from('notas')
      .select('*')
      .order('actualizado_en', { ascending: false });
    setNotas((data as Nota[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (editando) tituloRef.current?.focus();
  }, [editando?.id]);

  function abrirNueva() {
    setEditando({ ...NOTA_VACIA });
  }

  function abrirEditar(nota: Nota) {
    setEditando({ id: nota.id, titulo: nota.titulo, contenido: nota.contenido ?? '', color: nota.color });
  }

  function cancelar() {
    setEditando(null);
  }

  async function guardar() {
    if (!editando) return;
    if (!editando.titulo.trim() && !editando.contenido.trim()) {
      setEditando(null);
      return;
    }

    setGuardando(true);

    if (editando.id) {
      // Actualizar
      const { error } = await supabase
        .from('notas')
        .update({
          titulo: editando.titulo.trim() || 'Sin título',
          contenido: editando.contenido.trim() || null,
          color: editando.color,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', editando.id);

      if (!error) {
        setNotas((prev) =>
          prev.map((n) =>
            n.id === editando.id
              ? { ...n, titulo: editando.titulo.trim() || 'Sin título', contenido: editando.contenido.trim() || null, color: editando.color, actualizado_en: new Date().toISOString() }
              : n,
          ),
        );
      }
    } else {
      // Crear
      const { data, error } = await supabase
        .from('notas')
        .insert({
          titulo: editando.titulo.trim() || 'Sin título',
          contenido: editando.contenido.trim() || null,
          color: editando.color,
        })
        .select()
        .single();

      if (!error && data) {
        setNotas((prev) => [data as Nota, ...prev]);
      }
    }

    setGuardando(false);
    setEditando(null);
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta nota?')) return;
    await supabase.from('notas').delete().eq('id', id);
    setNotas((prev) => prev.filter((n) => n.id !== id));
    if (editando?.id === id) setEditando(null);
  }

  if (cargando) return <p style={{ padding: '1rem' }}>Cargando...</p>;

  return (
    <div style={{ padding: '1rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0 }}>Notas</h1>
        <button
          onClick={abrirNueva}
          style={{ padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', fontSize: '0.95rem' }}
        >
          + Nueva nota
        </button>
      </div>

      {/* Editor */}
      {editando && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '1rem',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) guardar(); }}
        >
          <div style={{
            background: editando.color,
            borderRadius: 12,
            padding: '1.25rem',
            width: '100%',
            maxWidth: 520,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <input
              ref={tituloRef}
              placeholder="Título"
              value={editando.titulo}
              onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '1.1rem',
                fontWeight: 600,
                outline: 'none',
                width: '100%',
                padding: '0.25rem 0',
                borderBottom: '1px solid rgba(0,0,0,0.12)',
              }}
            />

            <textarea
              placeholder="Escribe algo..."
              value={editando.contenido}
              onChange={(e) => setEditando({ ...editando, contenido: e.target.value })}
              rows={8}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                resize: 'vertical',
                width: '100%',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                padding: '0.25rem 0',
              }}
            />

            {/* Paleta de colores */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.25rem' }}>Color:</span>
              {COLORES.map((c) => (
                <button
                  key={c.valor}
                  title={c.label}
                  onClick={() => setEditando({ ...editando, color: c.valor })}
                  style={{
                    width: 22, height: 22,
                    borderRadius: '50%',
                    background: c.valor,
                    border: editando.color === c.valor ? '2px solid #1a73e8' : '1px solid #ccc',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editando.id && (
                <button
                  onClick={() => eliminar(editando.id!)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.85rem' }}
                >
                  Eliminar
                </button>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                <button
                  onClick={cancelar}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: 6, cursor: 'pointer', border: '1px solid #ccc', background: 'transparent' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: 6, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none' }}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de notas */}
      {notas.length === 0 && (
        <p style={{ color: '#888' }}>No hay notas todavía. ¡Crea una!</p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '0.85rem',
      }}>
        {notas.map((nota) => (
          <div
            key={nota.id}
            onClick={() => abrirEditar(nota)}
            style={{
              background: nota.color,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 10,
              padding: '0.85rem',
              cursor: 'pointer',
              minHeight: 120,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              transition: 'box-shadow 0.15s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.13)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
          >
            {nota.titulo && (
              <strong style={{ fontSize: '0.95rem', lineHeight: 1.3 }}>{nota.titulo}</strong>
            )}
            {nota.contenido && (
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#444',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.5,
              }}>
                {nota.contenido}
              </p>
            )}
            <span style={{ marginTop: 'auto', fontSize: '0.73rem', color: '#999' }}>
              {new Date(nota.actualizado_en).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
