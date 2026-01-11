import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'primary' | 'accent' | 'success';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'gradient-primary text-primary-foreground',
  accent: 'gradient-accent text-accent-foreground',
  success: 'gradient-success text-success-foreground',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-white/20 text-white',
  accent: 'bg-white/20 text-white',
  success: 'bg-white/20 text-white',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const isGradient = variant !== 'default';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('text-sm font-medium', isGradient ? 'text-white/80' : 'text-muted-foreground')}>
            {title}
          </p>
          <p className={cn('mt-2 text-3xl font-bold', isGradient ? 'text-white' : 'text-foreground')}>
            {value}
          </p>
          {subtitle && (
            <p className={cn('mt-1 text-sm', isGradient ? 'text-white/70' : 'text-muted-foreground')}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn('mt-2 flex items-center gap-1 text-sm', trend.isPositive ? 'text-success' : 'text-destructive')}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}% so với tuần trước</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconVariantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Decorative element */}
      {isGradient && (
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      )}
    </div>
  );
}
