import { NavBar } from '@/components/layout/NavBar'
import { WorkshopProgress } from './WorkshopProgress'
import { BroadcastBanner } from './BroadcastBanner'

interface CompletedScreenProps {
  message: string
  broadcastMessage: string | null
  onDismissBroadcast: () => void
}

export function CompletedScreen({ message, broadcastMessage, onDismissBroadcast }: CompletedScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-faint">
      <NavBar />
      <BroadcastBanner message={broadcastMessage} onDismiss={onDismissBroadcast} />
      <WorkshopProgress />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-brand-200 bg-brand-50">
          <svg
            className="h-10 w-10 text-brand-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-semibold text-ink">{message}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Waiting for the facilitator to open the next activity.
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs text-ink-subtle">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" aria-hidden="true" />
          Connected
        </span>
      </div>
    </div>
  )
}
