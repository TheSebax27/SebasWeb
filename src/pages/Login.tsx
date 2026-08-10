import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Btn, Field } from '../components/UI';

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
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-brand">
          <div className="login-mark">S</div>
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-sub">Acceso privado</p>
        </div>

        <form onSubmit={manejarLogin} className="flex-col gap-md">
          <Field label="Correo">
            <input
              className="input"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="Contraseña">
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </Field>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Btn variant="primary" type="submit" disabled={enviando} className="w-full" style={{ justifyContent: 'center' }}>
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </Btn>
        </form>
      </div>
    </div>
  );
}
