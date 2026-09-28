import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: ReactNode
  body?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-xl border border-dashed border-line-strong px-8 py-16 text-center', className)}>
      <h2 className="font-display text-title text-ink">{title}</h2>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
