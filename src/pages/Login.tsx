import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (session) {
    const destino = (location.state as { from?: string })?.from ?? '/';
    return <Navigate to={destino} replace />;
  }

  async function manejarLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setEnviando(false);
    if (error) setError('Correo o contraseña incorrectos');
  }

  return (
    <div style={{ maxWidth: 360, margin: '4rem auto' }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
