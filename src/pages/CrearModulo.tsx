import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PageHeader, Btn, Field } from '../components/UI';

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
    if (error) { setError('No se pudo crear el módulo'); return; }
    navigate(`/modulos/${data.id}`);
  }

  return (
    <div className="page">
      <PageHeader num="01 / MÓDULOS" title="Nuevo módulo" />

      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={manejarSubmit} className="flex-col gap-md">
          <Field label="Nombre">
            <input
              className="input"
              placeholder="Ej. Chaqueta Sebastián"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
            />
          </Field>

          <Field label="Descripción (opcional)">
            <textarea
              className="textarea-input"
              placeholder="Breve descripción del módulo"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </Field>

          {error && <p className="text-sm text-error">{error}</p>}

          <Btn variant="primary" type="submit" disabled={enviando}>
            {enviando ? 'Creando...' : 'Crear módulo'}
          </Btn>
        </form>
      </div>
    </div>
  );
}
