import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[110px] w-full rounded-lg border bg-surface px-3.5 py-3 text-sm text-ink',
          'transition-colors duration-150 resize-y',
          'placeholder:text-ink-subtle',
          'border-border hover:border-border-strong',
          'focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-1',
          error && 'border-error focus:border-error focus:ring-error/15',
          className,
        )}
        {...props}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-error font-medium">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 7a.875.875 0 110-1.75.875.875 0 010 1.75z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  ),
)
Textarea.displayName = 'Textarea'
