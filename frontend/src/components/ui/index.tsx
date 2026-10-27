import { clsx } from 'clsx';
import type { ReactNode } from 'react';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  secondaryValue?: string;
  badge?: { text: string; type: 'positive' | 'negative' | 'neutral' };
  footer?: ReactNode;
  isLoading?: boolean;
}

export function KPICard({ icon, label, value, unit, secondaryValue, badge, footer, isLoading }: KPICardProps) {
  if (isLoading) return <KPICardSkeleton />;

  return (
    <div className="card p-lg flex flex-col justify-between hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
          <span className="text-label-md text-secondary">{label}</span>
        </div>
        {badge && (
          <span className={clsx(
            'text-label-sm font-semibold px-xs py-0.5 rounded-full',
            badge.type === 'positive' && 'bg-status-green-bg text-status-green-text',
            badge.type === 'negative' && 'bg-status-red-bg text-status-red-text',
            badge.type === 'neutral'  && 'bg-surface-container text-secondary',
          )}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="my-sm">
        <div className="flex items-baseline gap-2xs">
          <span className="metric-num text-metric-headline text-primary">{value}</span>
          {unit && <span className="text-headline-sm text-secondary">{unit}</span>}
          {secondaryValue && (
            <span className="text-label-md text-on-surface-variant ml-xs">{secondaryValue}</span>
          )}
        </div>
      </div>
      {footer && <div>{footer}</div>}
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="card p-lg animate-pulse">
      <div className="flex items-center gap-xs mb-sm">
        <div className="w-8 h-8 rounded-lg bg-surface-container" />
        <div className="h-3 w-24 bg-surface-container rounded" />
      </div>
      <div className="h-10 w-32 bg-surface-container rounded mb-sm" />
      <div className="h-4 w-40 bg-surface-container rounded" />
    </div>
  );
}

// ─── Status Chip ──────────────────────────────────────────────────────────────

interface StatusChipProps {
  status: 'ok' | 'warning' | 'error' | 'info' | 'neutral';
  label: string;
  dot?: boolean;
}

export function StatusChip({ status, label, dot = true }: StatusChipProps) {
  const styles = {
    ok:      'chip-green',
    warning: 'chip-amber',
    error:   'chip-red',
    info:    'bg-blue-50 text-status-blue-text border border-blue-200 rounded-full px-xs py-0.5 text-label-sm font-semibold',
    neutral: 'chip-neutral',
  };
  const dotColors = {
    ok:      'bg-status-green-text',
    warning: 'bg-status-amber-text',
    error:   'bg-status-red-text',
    info:    'bg-status-blue-text',
    neutral: 'bg-outline',
  };

  return (
    <span className={clsx('inline-flex items-center gap-2xs', styles[status])}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[status])} />}
      {label}
    </span>
  );
}

// ─── Device Status Chip ───────────────────────────────────────────────────────

import type { DeviceStatus } from '../../types';

export function DeviceStatusChip({ status }: { status: DeviceStatus }) {
  const map: Record<DeviceStatus, { label: string; s: StatusChipProps['status'] }> = {
    online:      { label: 'Online',      s: 'ok'      },
    offline:     { label: 'Offline',     s: 'error'   },
    unavailable: { label: 'Unavailable', s: 'warning' },
    unknown:     { label: 'Unknown',     s: 'neutral' },
  };
  const { label, s } = map[status] || { label: status, s: 'neutral' as const };
  return <StatusChip status={s} label={label} />;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse bg-surface-container rounded', className)} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-md text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-md">
        <span className="material-symbols-outlined text-[32px] text-outline">{icon}</span>
      </div>
      <h3 className="text-headline-sm text-on-surface mb-xs">{title}</h3>
      {description && <p className="text-body-md text-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-md">{action}</div>}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="card p-lg flex flex-col items-center text-center py-12">
      <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-sm">
        <span className="material-symbols-outlined text-[24px] text-on-error-container">error</span>
      </div>
      <h3 className="text-headline-sm text-on-surface mb-xs">{title}</h3>
      <p className="text-body-md text-secondary mb-md max-w-md">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  isDemo?: boolean;
}

export function PageHeader({ title, subtitle, badge, actions, isDemo }: PageHeaderProps) {
  return (
    <div className="page-header mb-lg">
      <div className="flex flex-col">
        <div className="flex items-center gap-xs flex-wrap">
          <h1 className="text-headline-lg text-primary font-semibold tracking-tight">{title}</h1>
          {badge && (
            <span className="px-xs py-0.5 rounded-full bg-surface-container-high text-primary-container text-label-sm font-semibold uppercase tracking-wider">
              {badge}
            </span>
          )}
          {isDemo && (
            <span className="demo-badge">
              <span className="material-symbols-outlined text-[14px]">science</span>
              Demo Data
            </span>
          )}
        </div>
        {subtitle && <p className="text-body-lg text-on-surface-variant mt-xs">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-xs">{actions}</div>}
    </div>
  );
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  isDangerous, onConfirm, onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-inverse-surface/30" onClick={onCancel} />
      <div className="relative card p-xl max-w-md w-full mx-md shadow-modal animate-fade-in">
        <h2 className="text-headline-sm text-on-surface mb-xs">{title}</h2>
        <p className="text-body-lg text-on-surface-variant mb-lg">{message}</p>
        <div className="flex justify-end gap-sm">
          <button onClick={onCancel} className="btn-secondary">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={isDangerous ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function ToggleSwitch({ checked, onChange, disabled, label, id }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'toggle-track',
        checked ? 'bg-primary-container' : 'bg-outline-variant',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className={clsx(
        'toggle-thumb',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )} />
    </button>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: 'chip-red',
    warning:  'chip-amber',
    info:     'chip-neutral',
  };
  return (
    <span className={clsx('rounded-full px-xs py-0.5 text-label-sm font-semibold uppercase', map[severity] || 'chip-neutral')}>
      {severity}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high:   'chip-red',
    medium: 'chip-amber',
    low:    'chip-neutral',
  };
  const label = priority === 'high' ? 'HIGH PRIORITY' : priority === 'medium' ? 'MEDIUM PRIORITY' : 'LOW PRIORITY';
  return (
    <span className={clsx('rounded-full px-xs py-0.5 text-label-sm font-semibold', map[priority] || 'chip-neutral')}>
      {label}
    </span>
  );
}

// ─── Data Quality Indicator ───────────────────────────────────────────────────

export function DataQualityBadge({ quality }: { quality: string }) {
  const map: Record<string, { icon: string; color: string; label: string }> = {
    good:         { icon: 'check_circle', color: 'text-status-green-text', label: 'Valid • HA Sync' },
    partial:      { icon: 'info',         color: 'text-status-amber-text',  label: 'Partial' },
    interpolated: { icon: 'timeline',     color: 'text-status-amber-text',  label: 'Interpolated' },
    demo:         { icon: 'science',      color: 'text-secondary',           label: 'Demo' },
  };
  const { icon, color, label } = map[quality] || map.demo;
  return (
    <span className={clsx('flex items-center gap-2xs text-label-sm', color)}>
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </span>
  );
}
