import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type StatusTone = 'idle' | 'live' | 'done' | 'warning' | 'danger'

const dotClasses: Record<StatusTone, string> = {
  idle:    'bg-ink-faint',
  live:    'bg-clay-600',
  done:    'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
}

interface StatusProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone
}

/** Dot + text. Replaces filled pill badges. */
export function Status({ tone = 'idle', className, children, ...props }: StatusProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-meta font-medium text-ink-muted', className)} {...props}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[tone])} aria-hidden="true" />
      {children}
    </span>
  )
}
