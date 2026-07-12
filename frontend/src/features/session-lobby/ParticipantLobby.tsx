import { useParams } from 'react-router-dom'
import { NavBar } from '@/components/layout/NavBar'
import { BroadcastBanner } from '@/components/ui/BroadcastBanner'
import { WorkshopProgress } from '@/components/ui/WorkshopProgress'
import { t } from '@/lib/i18n'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { getStoredParticipant } from '@/lib/utils'

export function ParticipantLobby() {
  const { slug } = useParams<{ slug: string }>()
  const participant = getStoredParticipant()
  const { broadcastMessage, dismissBroadcast } = useWorkshopChannel(slug)

  return (
    <div className="flex min-h-screen flex-col bg-surface-faint">
      <NavBar />
      <BroadcastBanner message={broadcastMessage} onDismiss={dismissBroadcast} />
      <WorkshopProgress />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        {/* Animated ring */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-2 border-brand-300 animate-ping"
            style={{ animationDuration: '2s' }}
            aria-hidden="true"
          />
          <div className="flex h-full w-full items-center justify-center rounded-full border border-brand-200 bg-brand-50">
            <svg
              className="h-8 w-8 text-brand-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('participant_lobby.waiting_title')}</h1>
          <p className="mt-2 text-sm text-ink-muted">{t('participant_lobby.waiting_subtitle')}</p>
        </div>

        {participant && (
          <div className="mt-2 rounded-xl border border-border bg-surface px-8 py-5 text-left shadow-sm">
            <dl className="space-y-1.5">
              <div className="flex gap-3 text-sm">
                <dt className="w-16 shrink-0 text-ink-subtle">{t('participant_lobby.your_name')}</dt>
                <dd className="font-medium text-ink">{participant.display_name}</dd>
              </div>
              <div className="flex gap-3 text-sm">
                <dt className="w-16 shrink-0 text-ink-subtle">{t('participant_lobby.your_role')}</dt>
                <dd className="font-medium text-ink">{participant.role}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fire-500" aria-hidden="true" />
          <span className="text-xs text-ink-subtle">{t('participant_lobby.connected')}</span>
        </div>
      </div>
    </div>
  )
}
