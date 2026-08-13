import React from 'react';

/* ── Íconos (SVG propios, sin dependencias externas) ──────────── */
export const Icon = {
  Sparkle: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 2c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" fill="currentColor" />
      <path d="M19 15c.3 1.6 1.1 2.4 2.7 2.7-1.6.3-2.4 1.1-2.7 2.7-.3-1.6-1.1-2.4-2.7-2.7 1.6-.3 2.4-1.1 2.7-2.7Z" fill="currentColor" opacity=".7" />
    </svg>
  ),
  User: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  ),
  Lock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  ),
  Eye: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  ),
  EyeOff: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6C11 5.5 11.5 5.5 12 5.5c6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-3.2 3.9M6.4 6.9C4 8.5 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.3 0 2.5-.3 3.6-.8" />
      <path d="M9.9 9.9a2.8 2.8 0 0 0 3.9 3.9" />
    </svg>
  ),
  ArrowRight: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  ),
  LogOut: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  ShieldLock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9.5 12.5l1.8 1.8L14.7 10" />
    </svg>
  ),
  Pencil: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  ),
  Trash: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Check: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

/* ── Brand: sello + wordmark, se repite en login, navbar y ────── */
/* ── encabezados de página ─────────────────────────────────────── */
export function SparkleSeal({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'w-7 h-7', md: 'w-10 h-10', lg: 'w-14 h-14' }[size];
  const iconDims = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' }[size];
  return (
    <div className={`relative flex items-center justify-center rounded-full glass nav-glow shrink-0 ${dims}`}>
      <Icon.Sparkle className={`text-emerald-400 sparkle-spin ${iconDims}`} />
    </div>
  );
}

export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }[size];
  return (
    <span className={`font-serif ${cls} tracking-tight`}>
      <span className="text-gray-50">Sebas</span>{' '}
      <span className="text-emerald-400 italic">Web</span>
    </span>
  );
}

/* ── PageHeader ─────────────────────────────────────────────── */
interface PageHeaderProps {
  num: string;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ num, title, sub, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 pb-6 border-b border-gray-800">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Icon.Sparkle className="w-3 h-3 text-emerald-500" />
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-500">{num}</p>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-gray-50 tracking-tight leading-none">{title}</h1>
          {sub && <p className="mt-2 text-sm text-gray-400">{sub}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

/* ── Btn ────────────────────────────────────────────────────── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'text' | 'danger' | 'dark';
  size?: 'sm' | 'md';
}

const btnBase = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap';
const btnVariants = {
  primary: 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 border border-emerald-500 hover:border-emerald-400 shadow-[0_2px_16px_-4px_rgba(190,143,42,0.5)]',
  dark:    'bg-gray-950 hover:bg-gray-900 text-gray-50 border border-gray-800 hover:border-gray-700',
  ghost:   'bg-transparent hover:bg-gray-800/60 text-gray-200 border border-gray-700 hover:border-gray-600',
  text:    'bg-transparent hover:bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-transparent',
  danger:  'bg-transparent hover:bg-rose-950 text-gray-500 hover:text-rose-400 border border-transparent text-xs',
};
const btnSizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
};

export function Btn({ variant = 'ghost', size = 'md', className = '', children, ...props }: BtnProps) {
  return (
    <button className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ── Field ──────────────────────────────────────────────────── */
interface FieldProps { label: string; children: React.ReactNode; }

export function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">{label}</label>
      {children}
    </div>
  );
}

/* ── Input base class helper ────────────────────────────────── */
export const inputCls = 'w-full bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm px-3 py-2 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors duration-150';
export const selectCls = `${inputCls} cursor-pointer`;
export const textareaCls = `${inputCls} resize-y min-h-[80px] leading-relaxed`;

/* ── Badge ──────────────────────────────────────────────────── */
interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'accent';
  children: React.ReactNode;
}
const badgeVariants = {
  neutral: 'bg-gray-800 text-gray-400 border-gray-700',
  success: 'bg-sage-950/60 text-sage-400 border-sage-900',
  warning: 'bg-amber-950/60 text-amber-400 border-amber-900',
  error:   'bg-rose-950/60 text-rose-400 border-rose-900',
  accent:  'bg-violet-950/60 text-violet-400 border-violet-900',
};
export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border ${badgeVariants[variant]}`}>
      {children}
    </span>
  );
}

/* ── StatTile ───────────────────────────────────────────────── */
export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="font-serif text-2xl text-gray-50 tracking-tight leading-none">{value}</div>
      <div className="mt-1.5 text-[10px] font-semibold tracking-widest uppercase text-gray-500">{label}</div>
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────────────── */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center">
      <Icon.Sparkle className="w-5 h-5 text-gray-700" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────── */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-xl ${className}`}>
      {children}
    </div>
  );
}

/* ── ConfirmDialog ──────────────────────────────────────────── */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/75 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-rose-950/60 border border-rose-900 flex items-center justify-center shrink-0">
            <Icon.Trash className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className="font-semibold text-gray-100 leading-snug">{title}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6 pl-12 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <Btn variant="ghost" size="sm" onClick={onCancel}>Cancelar</Btn>
          <Btn
            variant="ghost"
            size="sm"
            onClick={onConfirm}
            className="!text-rose-400 !border-rose-900 hover:!bg-rose-950 hover:!text-rose-300"
          >
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}
