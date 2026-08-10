import React from 'react';

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
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-500 mb-1">{num}</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-gray-50 tracking-tight leading-none">{title}</h1>
          {sub && <p className="mt-1.5 text-sm text-gray-400">{sub}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

/* ── Btn ────────────────────────────────────────────────────── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'text' | 'danger';
  size?: 'sm' | 'md';
}

const btnBase = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap';
const btnVariants = {
  primary: 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 border border-emerald-500 hover:border-emerald-400',
  ghost:   'bg-transparent hover:bg-gray-800 text-gray-200 border border-gray-700 hover:border-gray-600',
  text:    'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent',
  danger:  'bg-transparent hover:bg-rose-950 text-gray-500 hover:text-rose-400 border border-transparent text-xs',
};
const btnSizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
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
  success: 'bg-emerald-950/60 text-emerald-400 border-emerald-900',
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="font-serif text-2xl text-gray-50 tracking-tight leading-none">{value}</div>
      <div className="mt-1.5 text-[10px] font-semibold tracking-widest uppercase text-gray-500">{label}</div>
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────────────── */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-gray-600">{message}</div>
  );
}

/* ── Card ───────────────────────────────────────────────────── */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl ${className}`}>
      {children}
    </div>
  );
}
