import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A bordered paper surface. No shadow: borders separate, shadows are for floating things. */
export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-xl border border-line bg-paper-raised', className)} {...props} />
}

interface PanelHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function PanelHeader({ title, description, action, className }: PanelHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4 border-b border-line px-6 py-4', className)}>
      <div className="min-w-0">
        <h2 className="text-heading font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-5', className)} {...props} />
}
