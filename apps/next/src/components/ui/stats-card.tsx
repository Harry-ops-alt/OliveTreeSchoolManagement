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
  primary: 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary',
  success: 'bg-gradient-to-br from-[hsl(var(--success))]/10 to-[hsl(var(--success))]/5 text-[hsl(var(--success))]',
  warning: 'bg-gradient-to-br from-[hsl(var(--warning))]/10 to-[hsl(var(--warning))]/5 text-[hsl(var(--warning))]',
  error: 'bg-gradient-to-br from-[hsl(var(--error))]/10 to-[hsl(var(--error))]/5 text-[hsl(var(--error))]',
  info: 'bg-gradient-to-br from-[hsl(var(--info))]/10 to-[hsl(var(--info))]/5 text-[hsl(var(--info))]',
};

const borderVariantStyles = {
  default: '',
  primary: 'border-l-2 border-l-primary/20',
  success: 'border-l-2 border-l-[hsl(var(--success))]/20',
  warning: 'border-l-2 border-l-[hsl(var(--warning))]/20',
  error: 'border-l-2 border-l-[hsl(var(--error))]/20',
  info: 'border-l-2 border-l-[hsl(var(--info))]/20',
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
    <Card className={`group bg-card border-border/50 shadow-soft transition-all duration-300 hover:shadow-medium hover:border-border hover:-translate-y-1 ${borderVariantStyles[variant]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`rounded-lg p-2.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${iconVariantStyles[variant]}`}>
            <Icon className="h-5 w-5" strokeWidth={2.5} />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Skeleton className="h-10 w-32" />
        ) : (
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{value}</div>
        )}
        {trend && !loading && (
          <div className="flex items-center gap-1.5">
            {trend.isPositive ? (
              <div className="flex items-center gap-1 rounded-full bg-[hsl(var(--success))]/10 px-2 py-0.5">
                <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" strokeWidth={2.5} />
                <span className="text-xs font-semibold text-[hsl(var(--success))]">
                  +{trend.value}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-[hsl(var(--error))]/10 px-2 py-0.5">
                <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--error))]" strokeWidth={2.5} />
                <span className="text-xs font-semibold text-[hsl(var(--error))]">
                  {trend.value}%
                </span>
              </div>
            )}
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
