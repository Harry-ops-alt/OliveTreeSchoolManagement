import { LucideIcon } from 'lucide-react';
import { Badge } from './badge';

interface AlertCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
  variant?: 'error' | 'warning' | 'info' | 'success';
  onClick?: () => void;
}

const variantStyles = {
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
};

const iconVariantStyles = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
};

export function AlertCard({ icon: Icon, title, count, variant = 'info', onClick }: AlertCardProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition-all duration-300 hover:scale-102 ${variantStyles[variant]}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <Icon className={`h-6 w-6 ${iconVariantStyles[variant]}`} />
        <Badge variant="secondary" className="text-lg font-bold">
          {count}
        </Badge>
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </p>
    </button>
  );
}
