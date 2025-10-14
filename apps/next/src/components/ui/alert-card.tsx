import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './card';

interface AlertCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
  variant?: 'error' | 'warning' | 'info' | 'success';
}

const variantStyles = {
  error: 'bg-[hsl(var(--error-subtle))] border-[hsl(var(--error))]/20',
  warning: 'bg-[hsl(var(--warning-subtle))] border-[hsl(var(--warning))]/20',
  info: 'bg-[hsl(var(--info-subtle))] border-[hsl(var(--info))]/20',
  success: 'bg-[hsl(var(--success-subtle))] border-[hsl(var(--success))]/20',
};

const iconVariantStyles = {
  error: 'bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]',
  warning: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
  info: 'bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]',
  success: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
};

const countVariantStyles = {
  error: 'text-[hsl(var(--error))]',
  warning: 'text-[hsl(var(--warning))]',
  info: 'text-[hsl(var(--info))]',
  success: 'text-[hsl(var(--success))]',
};

export function AlertCard({ icon: Icon, title, count, variant = 'info' }: AlertCardProps) {
  return (
    <Card className={`border ${variantStyles[variant]}`}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${iconVariantStyles[variant]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span className={`text-xl font-semibold ${countVariantStyles[variant]}`}>
          {count}
        </span>
      </CardContent>
    </Card>
  );
}
