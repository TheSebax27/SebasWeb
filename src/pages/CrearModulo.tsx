import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PageHeader, Btn, Field, inputCls, textareaCls } from '../components/UI';

export function CrearModulo() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null); setEnviando(true);
    const { data, error } = await supabase.functions.invoke('crear-modulo', { body: { nombre, descripcion } });
    setEnviando(false);
    if (error) { setError('No se pudo crear el módulo'); return; }
    navigate(`/modulos/${data.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader num="01 / MÓDULOS" title="Nuevo módulo" />
      <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-6 max-w-md flex flex-col gap-5">
        <form onSubmit={manejarSubmit} className="flex flex-col gap-5">
          <Field label="Nombre">
            <input className={inputCls} placeholder="Ej. Chaqueta Sebastián" value={nombre}
              onChange={e => setNombre(e.target.value)} required />
          </Field>
          <Field label="Descripción (opcional)">
            <textarea className={textareaCls} placeholder="Breve descripción del módulo"
              value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </Field>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <Btn variant="primary" type="submit" disabled={enviando}>
            {enviando ? 'Creando...' : 'Crear módulo'}
          </Btn>
        </form>
      </div>
    </div>
  );
}
