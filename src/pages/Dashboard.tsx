import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/UI';

/* ── Tipos ─────────────────────────────────────────────── */
interface DashStats {
  modulos:        number;
  fotos:          number;
  ingresosMes:    number;
  gastosMes:      number;
  metasActivas:   number;
  metasCompletadas: number;
  peliculas:      number;
  series:         number;
  juegos:         number;
  conciertosFui:  number;
  conciertosPend: number;
  partidosFui:    number;
  partidosPend:   number;
  notas:          number;
  rutinas:        number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('es', { maximumFractionDigits: 0 }).format(n);
}

/* ── Tarjeta de sección ─────────────────────────────────── */
function SectionCard({
  to, emoji, title, accent, rows, visible = true,
}: {
  to: string;
  emoji: string;
  title: string;
  accent: string;
  rows: { label: string; value: string | number }[];
  visible?: boolean;
}) {
  if (!visible) return null;
  return (
    <Link to={to} className="group block bg-gray-900/60 border border-gray-800/70 hover:border-gray-700 rounded-2xl p-5 transition-all duration-200 hover:bg-gray-900/80">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl leading-none">{emoji}</span>
        <span className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${accent}`}>{title}</span>
        <Icon.ArrowRight className={`w-3.5 h-3.5 ml-auto ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {rows.map(r => (
          <div key={r.label}>
            <div className="font-serif text-xl text-gray-50 leading-none tabular-nums">{r.value}</div>
            <div className="text-[9px] font-semibold tracking-wider uppercase text-gray-600 mt-1 leading-tight">{r.label}</div>
          </div>
        ))}
      </div>
    </Link>
  );
}

/* ── Balance pill ───────────────────────────────────────── */
function BalancePill({ ingreso, gasto }: { ingreso: number; gasto: number }) {
  const balance = ingreso - gasto;
  const pos = balance >= 0;
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${pos ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 'bg-rose-950/40 text-rose-400 border-rose-900/50'}`}>
      {pos ? '+' : ''}{fmt(balance)}
    </span>
  );
}

/* ── Componente principal ───────────────────────────────── */
export function Dashboard() {
  const { perfil, tieneAcceso } = useAuth();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [cargando, setCargando] = useState(true);

  const esAdmin = perfil?.rol === 'admin';
  const verFinanzas       = esAdmin || tieneAcceso('finanzas');
  const verMetas          = esAdmin || tieneAcceso('metas');
  const verGym            = esAdmin || tieneAcceso('gym');
  const verNotas          = esAdmin || tieneAcceso('notas');
  const verEntretenimiento= esAdmin || tieneAcceso('entretenimiento');
  const verEventos        = esAdmin || tieneAcceso('eventos');
  const verGaleria        = esAdmin || tieneAcceso('galeria');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    const ahora     = new Date();
    const mesInicio = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;

    const [
      { count: cModulos },
      { count: cFotos },
      { count: cSubFotos },
      { data: txsMes },
      { data: metasData },
      { count: cNotas },
      { data: entertData },
      { data: conciertosData },
      { data: partidosData },
      { count: cRutinas },
    ] = await Promise.all([
      supabase.from('modulos').select('*', { count: 'exact', head: true }),
      supabase.from('modulo_fotos').select('*', { count: 'exact', head: true }),
      supabase.from('submodulo_fotos').select('*', { count: 'exact', head: true }),
      supabase.from('transacciones').select('tipo, monto').gte('fecha', mesInicio),
      supabase.from('metas').select('completada'),
      supabase.from('notas').select('*', { count: 'exact', head: true }),
      supabase.from('entretenimiento').select('tipo, estado'),
      supabase.from('conciertos').select('estado'),
      supabase.from('partidos').select('estado'),
      supabase.from('rutinas').select('*', { count: 'exact', head: true }),
    ]);

    const txs = (txsMes ?? []) as { tipo: string; monto: number }[];
    const ingresosMes = txs.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
    const gastosMes   = txs.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);

    const metas = (metasData ?? []) as { completada: boolean }[];
    const entret = (entertData ?? []) as { tipo: string; estado: string }[];
    const conciertos = (conciertosData ?? []) as { estado: string }[];
    const partidos   = (partidosData   ?? []) as { estado: string }[];

    setStats({
      modulos:          cModulos ?? 0,
      fotos:            (cFotos ?? 0) + (cSubFotos ?? 0),
      ingresosMes,
      gastosMes,
      metasActivas:     metas.filter(m => !m.completada).length,
      metasCompletadas: metas.filter(m =>  m.completada).length,
      peliculas:        entret.filter(e => e.tipo === 'pelicula').length,
      series:           entret.filter(e => e.tipo === 'serie').length,
      juegos:           entret.filter(e => e.tipo === 'juego').length,
      conciertosFui:    conciertos.filter(c => c.estado === 'fui').length,
      conciertosPend:   conciertos.filter(c => c.estado === 'quiero_ir').length,
      partidosFui:      partidos.filter(p => p.estado === 'fui').length,
      partidosPend:     partidos.filter(p => p.estado === 'quiero_ir').length,
      notas:            cNotas ?? 0,
      rutinas:          cRutinas ?? 0,
    });
    setCargando(false);
  }

  const mes = new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">

      {/* Header */}
      <div className="mb-8 pb-6 border-b border-gray-800/70">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Icon.Sparkle className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-emerald-500/80">RESUMEN</p>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-gray-50 tracking-tight leading-none">Dashboard</h1>
            <p className="mt-2.5 text-sm text-gray-500">{perfil?.nombre ?? perfil?.email} · {mes}</p>
          </div>
          {stats && verFinanzas && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Balance {new Date().toLocaleDateString('es', { month: 'short' })}</span>
              <BalancePill ingreso={stats.ingresosMes} gasto={stats.gastosMes} />
            </div>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900/40 border border-gray-800/50 rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <SectionCard
            to="/"
            emoji="🗂️"
            title="Tableros"
            accent="text-gray-400"
            visible={verGaleria}
            rows={[
              { label: 'Módulos',  value: stats.modulos },
              { label: 'Fotos',    value: fmt(stats.fotos) },
            ]}
          />

          <SectionCard
            to="/finanzas"
            emoji="💰"
            title="Finanzas"
            accent="text-emerald-400"
            visible={verFinanzas}
            rows={[
              { label: 'Ingresos', value: fmt(stats.ingresosMes) },
              { label: 'Gastos',   value: fmt(stats.gastosMes) },
              { label: 'Balance',  value: fmt(stats.ingresosMes - stats.gastosMes) },
            ]}
          />

          <SectionCard
            to="/metas"
            emoji="🎯"
            title="Metas"
            accent="text-amber-400"
            visible={verMetas}
            rows={[
              { label: 'Activas',     value: stats.metasActivas },
              { label: 'Completadas', value: stats.metasCompletadas },
              { label: 'Total',       value: stats.metasActivas + stats.metasCompletadas },
            ]}
          />

          <SectionCard
            to="/gym"
            emoji="🏋️"
            title="Gym"
            accent="text-orange-400"
            visible={verGym}
            rows={[
              { label: 'Rutinas', value: stats.rutinas },
            ]}
          />

          <SectionCard
            to="/notas"
            emoji="📝"
            title="Notas"
            accent="text-sky-400"
            visible={verNotas}
            rows={[
              { label: 'Notas', value: stats.notas },
            ]}
          />

          <SectionCard
            to="/entretenimiento"
            emoji="🎬"
            title="Entretenimiento"
            accent="text-violet-400"
            visible={verEntretenimiento}
            rows={[
              { label: 'Películas', value: stats.peliculas },
              { label: 'Series',    value: stats.series },
              { label: 'Juegos',    value: stats.juegos },
            ]}
          />

          <SectionCard
            to="/eventos"
            emoji="🎵"
            title="Conciertos"
            accent="text-pink-400"
            visible={verEventos}
            rows={[
              { label: 'Fui',      value: stats.conciertosFui },
              { label: 'Quiero ir',value: stats.conciertosPend },
              { label: 'Total',    value: stats.conciertosFui + stats.conciertosPend },
            ]}
          />

          <SectionCard
            to="/eventos"
            emoji="⚽"
            title="Partidos"
            accent="text-emerald-400"
            visible={verEventos}
            rows={[
              { label: 'Fui',      value: stats.partidosFui },
              { label: 'Quiero ir',value: stats.partidosPend },
              { label: 'Total',    value: stats.partidosFui + stats.partidosPend },
            ]}
          />

        </div>
      ) : null}
    </div>
  );
}
