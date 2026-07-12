import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'brand' | 'fire' | 'secondary' | 'ghost' | 'outline' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  brand:
    'bg-brand-600 text-white shadow-xs hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
  fire:
    'bg-fire-600 text-white shadow-xs hover:bg-fire-700 focus-visible:ring-2 focus-visible:ring-fire-600 focus-visible:ring-offset-2',
  secondary:
    'bg-surface-1 text-ink border border-border shadow-xs hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
  outline:
    'border border-border bg-surface text-ink shadow-xs hover:bg-surface-1 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-ink-muted hover:bg-surface-1 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
  destructive:
    'bg-error text-white shadow-xs hover:bg-error/90 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'brand', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150',
        'disabled:pointer-events-none disabled:opacity-40',
        'cursor-pointer select-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v3.5l4-4-4-4V4a10 10 0 00-10 10h3.5l-3.5 3.5L-.5 14 4 12z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
