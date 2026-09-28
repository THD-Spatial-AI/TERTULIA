import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-clay-600 text-white hover:bg-clay-700',
  secondary: 'border border-line-strong bg-paper-raised text-ink hover:border-ink-subtle hover:bg-paper-sunk',
  ghost:     'text-ink-muted hover:bg-paper-sunk hover:text-ink',
  danger:    'bg-danger text-white hover:bg-danger/90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-meta gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[0.9375rem] gap-2.5',
}

export const buttonClasses = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md') =>
  cn(
    'inline-flex items-center justify-center rounded-md font-medium select-none',
    'transition-[background-color,border-color,color,transform] duration-150 ease-soft',
    'active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-45',
    variantClasses[variant],
    sizeClasses[size],
  )

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, size), className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
