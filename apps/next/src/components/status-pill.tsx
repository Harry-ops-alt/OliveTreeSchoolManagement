'use client';

import { cn } from '@olive/ui';

export interface StatusPillProps {
  value: string;
  label?: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  // Active/Positive States - Green
  ENROLLED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  
  // Warning/Pending States - Orange/Yellow
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  APPLIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  PROSPECT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  
  // Negative States - Red
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  WITHDRAWN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  
  // Neutral/Inactive States - Gray
  ARCHIVED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
};

const DEFAULT_STYLE = 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800';

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
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        style,
        className,
      )}
    >
      {label ?? toLabel(value)}
    </span>
  );
}
