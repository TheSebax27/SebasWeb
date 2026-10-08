import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Sparkles, User, Lock, Eye, EyeOff, ArrowRight, LogOut,
  ShieldCheck, Pencil, Trash2, Check, X as XIcon,
  type LucideProps,
} from 'lucide-react';
import { cn } from '../lib/utils';

/* ── Íconos (lucide-react, misma API) ───────────────────────────── */
export const Icon = {
  Sparkle:   (p: LucideProps) => <Sparkles   strokeWidth={1.6} {...p} />,
  User:      (p: LucideProps) => <User        strokeWidth={1.6} {...p} />,
  Lock:      (p: LucideProps) => <Lock        strokeWidth={1.6} {...p} />,
  Eye:       (p: LucideProps) => <Eye         strokeWidth={1.6} {...p} />,
  EyeOff:    (p: LucideProps) => <EyeOff      strokeWidth={1.6} {...p} />,
  ArrowRight:(p: LucideProps) => <ArrowRight  strokeWidth={1.8} {...p} />,
  LogOut:    (p: LucideProps) => <LogOut      strokeWidth={1.6} {...p} />,
  ShieldLock:(p: LucideProps) => <ShieldCheck strokeWidth={1.6} {...p} />,
  Pencil:    (p: LucideProps) => <Pencil      strokeWidth={1.6} {...p} />,
  Trash:     (p: LucideProps) => <Trash2      strokeWidth={1.6} {...p} />,
  Check:     (p: LucideProps) => <Check       strokeWidth={2}   {...p} />,
  X:         (p: LucideProps) => <XIcon       strokeWidth={2}   {...p} />,
};

/* ── Brand ──────────────────────────────────────────────────────── */
export function SparkleSeal({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims    = { sm: 'w-7 h-7',     md: 'w-10 h-10',   lg: 'w-14 h-14'  }[size];
  const iconDims= { sm: 'w-3.5 h-3.5', md: 'w-5 h-5',     lg: 'w-7 h-7'    }[size];
  return (
    <div className={cn('relative flex items-center justify-center rounded-full glass nav-glow shrink-0', dims)}>
      <Icon.Sparkle className={cn('text-emerald-400 sparkle-spin', iconDims)} />
    </div>
  );
}

export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }[size];
  return (
    <span className={cn('font-serif tracking-tight', cls)}>
      <span className="text-gray-50">Sebas</span>{' '}
      <span className="text-emerald-400 italic">Web</span>
    </span>
  );
}

/* ── PageHeader ─────────────────────────────────────────────────── */
interface PageHeaderProps {
  num: string;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ num, title, sub, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 pb-6 border-b border-gray-800/70">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Icon.Sparkle className="w-3 h-3 text-emerald-500" />
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-emerald-500/80">{num}</p>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-gray-50 tracking-tight leading-none">{title}</h1>
          {sub && <p className="mt-2.5 text-sm text-gray-500 leading-relaxed">{sub}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

/* ── Btn ────────────────────────────────────────────────────────── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'text' | 'danger' | 'dark';
  size?: 'sm' | 'md';
}

export function Btn({ variant = 'ghost', size = 'md', className = '', children, ...props }: BtnProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap select-none',
        {
          // primary — dorado cálido
          'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-gray-950 border border-emerald-500/80 hover:border-emerald-400 shadow-[0_1px_12px_-3px_rgba(190,143,42,0.45)] hover:shadow-[0_2px_18px_-3px_rgba(190,143,42,0.6)]':
            variant === 'primary',
          // dark
          'bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-gray-100 border border-gray-700 hover:border-gray-600':
            variant === 'dark',
          // ghost
          'bg-transparent hover:bg-gray-800/50 active:bg-gray-800 text-gray-200 border border-gray-700/80 hover:border-gray-600':
            variant === 'ghost',
          // text
          'bg-transparent hover:bg-gray-800/40 text-gray-400 hover:text-gray-200 border border-transparent':
            variant === 'text',
          // danger
          'bg-transparent hover:bg-rose-950/60 active:bg-rose-950 text-gray-500 hover:text-rose-400 border border-transparent text-xs':
            variant === 'danger',
        },
        { 'text-xs px-3 py-1.5 h-7':       size === 'sm' },
        { 'text-sm px-4 py-2 h-9':          size === 'md' },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Field ──────────────────────────────────────────────────────── */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-500/90">{label}</label>
      {children}
    </div>
  );
}

/* ── Input helpers ──────────────────────────────────────────────── */
export const inputCls =
  'w-full bg-gray-900/80 border border-gray-700/80 rounded-lg text-gray-100 text-sm px-3 py-2 ' +
  'placeholder-gray-600 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 ' +
  'transition-colors duration-150';
export const selectCls  = `${inputCls} cursor-pointer`;
export const textareaCls = `${inputCls} resize-y min-h-[80px] leading-relaxed`;

/* ── Badge ──────────────────────────────────────────────────────── */
interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'accent';
  children: React.ReactNode;
}
export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border',
      {
        'bg-gray-800/80 text-gray-400 border-gray-700':             variant === 'neutral',
        'bg-sage-950/60 text-sage-400 border-sage-900':             variant === 'success',
        'bg-amber-950/60 text-amber-400 border-amber-900':          variant === 'warning',
        'bg-rose-950/60 text-rose-400 border-rose-900':             variant === 'error',
        'bg-violet-950/60 text-violet-400 border-violet-900':       variant === 'accent',
      },
    )}>
      {children}
    </span>
  );
}

/* ── StatTile ───────────────────────────────────────────────────── */
export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800/70 rounded-xl p-4 flex flex-col gap-1.5">
      <div className="font-serif text-2xl text-gray-50 tracking-tight leading-none tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-500">{label}</div>
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────────────────── */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center">
      <div className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center">
        <Icon.Sparkle className="w-3.5 h-3.5 text-gray-700" />
      </div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────────── */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-gray-900/60 border border-gray-800/70 rounded-xl', className)}>
      {children}
    </div>
  );
}

/* ── ConfirmDialog (Radix Dialog — focus trap + Escape + animación) */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="dialog-overlay fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-sm"
        />
        <DialogPrimitive.Content
          className="dialog-content fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 bg-gray-900 border border-gray-800/80 rounded-2xl shadow-2xl focus:outline-none"
          onEscapeKeyDown={onCancel}
          onInteractOutside={onCancel}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-9 h-9 rounded-full bg-rose-950/50 border border-rose-900/60 flex items-center justify-center shrink-0 mt-0.5">
              <Icon.Trash className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1">
              <DialogPrimitive.Title className="text-sm font-semibold text-gray-100 leading-snug mb-1">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-gray-500 leading-relaxed">
                {message}
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-800/60">
            <Btn variant="ghost" size="sm" onClick={onCancel}>Cancelar</Btn>
            <button
              onClick={onConfirm}
              className="inline-flex items-center justify-center h-7 px-3 text-xs font-medium rounded-lg border cursor-pointer transition-all duration-150 bg-rose-950/40 hover:bg-rose-950 text-rose-400 hover:text-rose-300 border-rose-900/60 hover:border-rose-900"
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
