import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { inputCls } from '../components/UI';

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-gray-950 font-bold text-sm nav-glow mb-2">
            S
          </div>
          <h1 className="font-serif text-4xl text-gray-50 tracking-tight">Bienvenido</h1>
          <p className="text-sm text-gray-500">Acceso privado</p>
        </div>

        {/* Form */}
        <form onSubmit={manejarLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Correo</label>
            <input
              className={inputCls}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Contraseña</label>
            <input
              className={inputCls}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-1 w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-all duration-150 disabled:opacity-40 cursor-pointer"
          >
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
