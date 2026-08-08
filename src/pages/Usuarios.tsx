import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Perfil, Rol } from '../types';

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<Rol>('visualizador');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function cargarUsuarios() {
    const { data } = await supabase.from('perfiles').select('*').order('creado_en');
    setUsuarios((data as Perfil[]) ?? []);
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const { error } = await supabase.functions.invoke('crear-usuario', {
      body: { email, password, nombre, rol },
    });

    setEnviando(false);

    if (error) {
      setError('No se pudo crear el usuario (revisa que el correo no exista ya)');
      return;
    }

    setEmail('');
    setPassword('');
    setNombre('');
    setRol('visualizador');
    await cargarUsuarios();
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 640 }}>
      <h1>Usuarios</h1>

      <form onSubmit={manejarSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input placeholder="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          placeholder="Contraseña temporal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
          <option value="visualizador">Visualizador</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" disabled={enviando}>
          {enviando ? 'Creando...' : 'Crear usuario'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Correo</th>
            <th align="left">Nombre</th>
            <th align="left">Rol</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.nombre ?? '—'}</td>
              <td>{u.rol}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
