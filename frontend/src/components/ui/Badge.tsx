import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'brand' | 'fire' | 'success' | 'warning' | 'error' | 'neutral' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  brand:   'bg-brand-100 text-brand-700 ring-brand-200/50',
  fire:    'bg-fire-100 text-fire-700 ring-fire-200/50',
  success: 'bg-success-bg text-success ring-success/20',
  warning: 'bg-warning-bg text-warning ring-warning/20',
  error:   'bg-error-bg text-error ring-error/20',
  neutral: 'bg-surface-2 text-ink-muted ring-border',
  outline: 'bg-transparent text-ink-muted ring-border',
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
        'text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
