import { type ReactNode } from 'react'
import { ParticipantHeader } from '@/components/layout/Headers'
import { Button } from '@/components/ui/Button'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface CanvasLayoutProps {
  title: string
  description: string
  /** Left rail (stacks above the canvas on small screens). */
  palette?: ReactNode
  children: ReactNode
  submitLabel: string
  onSubmit: () => void
  saving?: boolean
  broadcastMessage: string | null
  onDismissBroadcast: () => void
}

/** Shared chrome for the four workshop activities: header with the one action, palette, work surface. */
export function CanvasLayout({
  title, description, palette, children, submitLabel, onSubmit, saving, broadcastMessage, onDismissBroadcast,
}: CanvasLayoutProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper">
      <ParticipantHeader broadcastMessage={broadcastMessage} onDismissBroadcast={onDismissBroadcast} />

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-line px-4 py-4 sm:px-6">
        <div className="min-w-0 max-w-3xl">
          <h1 className="font-display text-title text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={cn('text-meta text-ink-subtle', !saving && 'sr-only')} aria-live="polite">
            {saving ? t('common.autosaving') : ''}
          </span>
          <Button onClick={onSubmit} loading={saving}>{submitLabel}</Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {palette && (
          <aside
            aria-label={t('canvas.palette_label')}
            className="max-h-[38dvh] shrink-0 overflow-y-auto overscroll-contain border-b border-line bg-paper-sunk md:max-h-none md:w-72 md:border-r md:border-b-0"
          >
            {palette}
          </aside>
        )}
        <main id="main" className="relative min-h-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
