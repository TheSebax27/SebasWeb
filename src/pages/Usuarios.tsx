import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Perfil, Rol } from '../types';
import { PageHeader, Btn, Field, Badge, EmptyState, inputCls, selectCls } from '../components/UI';

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<Rol>('visualizador');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargarUsuarios() {
    const { data } = await supabase.from('perfiles').select('*').order('creado_en');
    setUsuarios((data as Perfil[]) ?? []);
  }

  useEffect(() => { cargarUsuarios(); }, []);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null); setEnviando(true);
    const { error } = await supabase.functions.invoke('crear-usuario', { body: { email, password, nombre, rol } });
    setEnviando(false);
    if (error) { setError('No se pudo crear el usuario'); return; }
    setEmail(''); setPassword(''); setNombre(''); setRol('visualizador');
    setMostrarForm(false); await cargarUsuarios();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
      <PageHeader
        num="07 / USUARIOS"
        title="Usuarios"
        sub="Gestión de accesos"
        actions={
          <Btn variant="primary" size="sm" onClick={() => setMostrarForm(f => !f)}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo usuario'}
          </Btn>
        }
      />

      {mostrarForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 max-w-md">
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-[10px] font-semibold tracking-widest uppercase text-gray-500 px-4 py-3">Nombre</th>
                <th className="text-left text-[10px] font-semibold tracking-widest uppercase text-gray-500 px-4 py-3">Correo</th>
                <th className="text-left text-[10px] font-semibold tracking-widest uppercase text-gray-500 px-4 py-3">Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-gray-200 font-medium">{u.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.rol === 'admin' ? 'success' : 'neutral'}>{u.rol}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
