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
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
  warning: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
  error: 'bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]',
  info: 'bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]',
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
    <Card className="bg-card shadow-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`rounded-xl p-2.5 ${iconVariantStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <div className="text-3xl font-semibold text-foreground">{value}</div>
        )}
        {trend && !loading && (
          <div className="flex items-center gap-1.5">
            {trend.isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--error))]" />
            )}
            <span className={`text-xs font-medium ${trend.isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--error))]'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
        {description && !trend && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
