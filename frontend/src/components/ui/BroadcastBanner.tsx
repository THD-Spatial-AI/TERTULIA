import { X } from 'lucide-react'
import { t } from '@/lib/i18n'

interface BroadcastBannerProps {
  message: string | null
  onDismiss: () => void
}

/** A facilitator's note, pinned to the top of the table. The live region stays mounted so updates are announced. */
export function BroadcastBanner({ message, onDismiss }: BroadcastBannerProps) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {message && (
        <div className="border-b border-line bg-paper-sunk px-4 py-3 sm:px-6" style={{ animation: 'rise-in 250ms var(--ease-soft)' }}>
          <div className="mx-auto flex max-w-3xl items-start gap-4 border-l-2 border-clay-600 pl-4">
            <div className="min-w-0 flex-1">
              <p className="text-meta text-ink-subtle">{t('broadcast.from')}</p>
              <p className="mt-0.5 font-display text-xl leading-snug text-ink break-words">{message}</p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t('broadcast.dismiss')}
              className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
