import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Icon, SparkleSeal } from '../components/UI';
import loginBg from '../assets/login-bg.jpg';

export function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState(false);

  if (session) {
    const destino = (location.state as { from?: string })?.from ?? '/';
    return <Navigate to={destino} replace />;
  }

  async function manejarLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setEnviando(false);
    if (error) setError('Usuario o contraseña incorrectos');
  }

  async function manejarOlvide() {
    if (!email) {
      setError('Escribe tu correo arriba para poder enviarte el enlace');
      return;
    }
    setError(null);
    setEnviandoReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setEnviandoReset(false);
    if (error) setError('No se pudo enviar el enlace de recuperación');
    else setAviso('Te enviamos un enlace a tu correo para restablecer la contraseña');
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Fondo: collage + velo oscuro para legibilidad */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/55 to-gray-950/85" />
      <div className="absolute inset-0 bg-gray-950/20" style={{ backdropFilter: 'blur(1px)' }} />
      <div className="drift-slow absolute top-1/4 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tarjeta de acceso */}
      <div className="relative w-full max-w-sm">
        <div
          className="relative rounded-[28px] px-8 py-9 flex flex-col items-center text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
          style={{
            background: 'linear-gradient(165deg, rgba(250,246,236,0.88), rgba(240,233,215,0.78))',
            border: '1px solid rgba(255,255,255,0.5)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
          }}
        >
          <SparkleSeal size="md" />

          <p className="mt-5 text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-600">
            Bienvenido a
          </p>
          <h1 className="font-serif text-4xl text-gray-950 tracking-tight leading-none mt-1.5">
            Sebas <span className="italic text-emerald-600">Web</span>
          </h1>
          <p className="mt-2.5 text-[13px] text-gray-700/80">
            Tu espacio personal. Accede para descubrirlo.
          </p>

          <form onSubmit={manejarLogin} className="mt-7 w-full flex flex-col gap-3 text-left">
            <div className="relative">
              <Icon.User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="w-full bg-white/60 border border-gray-950/10 rounded-xl text-gray-950 text-sm pl-10 pr-3.5 py-3 placeholder-gray-600/70 focus:outline-none focus:border-emerald-600/60 focus:ring-2 focus:ring-emerald-600/15 transition-all duration-150"
                type="email"
                placeholder="Usuario o correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Icon.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="w-full bg-white/60 border border-gray-950/10 rounded-xl text-gray-950 text-sm pl-10 pr-10 py-3 placeholder-gray-600/70 focus:outline-none focus:border-emerald-600/60 focus:ring-2 focus:ring-emerald-600/15 transition-all duration-150"
                type={verPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setVerPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {verPassword ? <Icon.EyeOff className="w-4 h-4" /> : <Icon.Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between mt-0.5 mb-1">
              <label className="flex items-center gap-1.5 text-[12px] text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={e => setRecordarme(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer"
                />
                Recordarme
              </label>
              <button
                type="button"
                onClick={manejarOlvide}
                disabled={enviandoReset}
                className="text-[12px] text-emerald-700 hover:text-emerald-600 font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {enviandoReset ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
              </button>
            </div>

            {error && <p className="text-xs text-rose-600 -mt-1">{error}</p>}
            {aviso && <p className="text-xs text-emerald-700 -mt-1">{aviso}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="mt-1 w-full py-3 rounded-xl bg-gray-950 hover:bg-gray-900 text-gray-50 font-semibold text-sm transition-all duration-150 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 group"
            >
              {enviando ? 'Ingresando...' : 'Entrar a mi espacio'}
              {!enviando && <Icon.ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />}
            </button>
          </form>

          <div className="w-full mt-7 pt-4 border-t border-gray-950/10 flex items-center justify-center gap-1.5">
            <Icon.ShieldLock className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-[11px] tracking-wide text-gray-600">Acceso exclusivo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
