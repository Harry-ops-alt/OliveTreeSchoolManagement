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
    <Card className="group bg-card border-border/40 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 ${iconVariantStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Skeleton className="h-10 w-32" />
        ) : (
          <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        )}
        {trend && !loading && (
          <div className="flex items-center gap-1.5">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[hsl(var(--error))]" />
            )}
            <span className={`text-sm font-semibold ${trend.isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--error))]'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
        {description && !trend && (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
