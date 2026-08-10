import React from 'react';

interface PageHeaderProps {
  num: string;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ num, title, sub, actions }: PageHeaderProps) {
  return (
    <div className="ph">
      <div className="ph-row">
        <div>
          <div className="ph-label">{num}</div>
          <h1 className="ph-title">{title}</h1>
          {sub && <p className="ph-sub">{sub}</p>}
        </div>
        {actions && <div className="flex gap-sm items-center flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'text' | 'danger';
  size?: 'sm' | 'md';
}

export function Btn({ variant = 'ghost', size = 'md', className = '', children, ...props }: BtnProps) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    className,
  ].filter(Boolean).join(' ');
  return <button className={cls} {...props}>{children}</button>;
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'accent';
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function Divider() {
  return <div className="divider" />;
}

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <div className="empty-state">{message}</div>;
}

interface StatTileProps {
  label: string;
  value: string | number;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="stat-tile">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
