import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function CrearModulo() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const { data, error } = await supabase.functions.invoke('crear-modulo', {
      body: { nombre, descripcion },
    });

    setEnviando(false);

    if (error) {
      setError('No se pudo crear el módulo');
      return;
    }

    navigate(`/modulos/${data.id}`);
  }

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', padding: '1rem' }}>
      <h1>Nuevo módulo</h1>
      <form onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          placeholder="Nombre (ej. Chaqueta Sebastian)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <textarea
          placeholder="Descripción (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Creando...' : 'Crear módulo'}
        </button>
      </form>
    </div>
  );
}
