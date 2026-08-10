import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Perfil, Rol } from '../types';
import { PageHeader, Btn, Field, EmptyState } from '../components/UI';

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
    setError(null);
    setEnviando(true);
    const { error } = await supabase.functions.invoke('crear-usuario', {
      body: { email, password, nombre, rol },
    });
    setEnviando(false);
    if (error) {
      setError('No se pudo crear el usuario');
      return;
    }
    setEmail(''); setPassword(''); setNombre(''); setRol('visualizador');
    setMostrarForm(false);
    await cargarUsuarios();
  }

  return (
    <div className="page">
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
        <div className="card mb-lg" style={{ maxWidth: 480 }}>
          <form onSubmit={manejarSubmit} className="flex-col gap-md">
            <Field label="Nombre">
              <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} />
            </Field>
            <Field label="Correo">
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </Field>
            <Field label="Contraseña temporal">
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </Field>
            <Field label="Rol">
              <select className="select-input" value={rol} onChange={e => setRol(e.target.value as Rol)}>
                <option value="visualizador">Visualizador</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
            {error && <p className="text-sm text-error">{error}</p>}
            <Btn variant="primary" type="submit" disabled={enviando}>
              {enviando ? 'Creando...' : 'Crear usuario'}
            </Btn>
          </form>
        </div>
      )}

      {usuarios.length === 0 ? (
        <EmptyState message="No hay usuarios registrados." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td className="font-500">{u.nombre ?? '—'}</td>
                  <td className="text-2">{u.email}</td>
                  <td>
                    <span className={`badge ${u.rol === 'admin' ? 'badge-accent' : 'badge-neutral'}`}>
                      {u.rol}
                    </span>
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
