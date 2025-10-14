import { LucideIcon } from 'lucide-react';
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
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

const variantStyles = {
  default: 'border-l-4 border-l-muted-foreground/20',
  primary: 'border-l-4 border-l-primary',
  success: 'border-l-4 border-l-chart-3',
  warning: 'border-l-4 border-l-chart-4',
  error: 'border-l-4 border-l-destructive',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-chart-3/10 text-chart-3',
  warning: 'bg-chart-4/10 text-chart-4',
  error: 'bg-destructive/10 text-destructive',
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
    <Card className={`${variantStyles[variant]} bg-card transition-all hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`rounded-lg p-2 ${iconVariantStyles[variant]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold text-foreground">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            <span className={trend.isPositive ? 'text-chart-3' : 'text-destructive'}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
