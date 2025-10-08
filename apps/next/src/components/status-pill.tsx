'use client';

import { cn } from '@olive/ui';

export interface StatusPillProps {
  value: string;
  label?: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'border-amber-400/50 bg-amber-500/20 text-amber-100',
  APPROVED: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100',
  REJECTED: 'border-red-500/50 bg-red-500/20 text-red-100',
  ENROLLED: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100',
  ARCHIVED: 'border-slate-500/40 bg-slate-500/20 text-slate-100',
};

const DEFAULT_STYLE = 'border-emerald-500/30 bg-emerald-900/50 text-emerald-100/80';

function toLabel(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function StatusPill({ value, label, className }: StatusPillProps): JSX.Element {
  const style = STATUS_STYLES[value.toUpperCase()] ?? DEFAULT_STYLE;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        style,
        className,
      )}
    >
      {label ?? toLabel(value)}
    </span>
  );
}
