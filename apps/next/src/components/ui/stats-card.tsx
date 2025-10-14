import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Skeleton } from './skeleton';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const iconVariantStyles = {
  default: 'bg-gradient-to-br from-gray-500 to-gray-600',
  primary: 'bg-gradient-to-br from-blue-500 to-blue-600',
  success: 'bg-gradient-to-br from-green-500 to-green-600',
  warning: 'bg-gradient-to-br from-orange-500 to-orange-600',
  error: 'bg-gradient-to-br from-red-500 to-red-600',
  info: 'bg-gradient-to-br from-purple-500 to-purple-600',
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
  variant = 'default',
}: StatsCardProps) {
  return (
    <Card className="group border-none bg-gradient-to-br from-white to-gray-50 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-gray-900 dark:to-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                {value}
              </p>
            )}
            {trend && !loading && (
              <div className="mt-2 flex items-center gap-1 text-sm font-medium text-green-600">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={`rounded-xl p-3 shadow-lg ${iconVariantStyles[variant]}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        {description && !trend && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
