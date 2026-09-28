import { useParams } from 'react-router-dom'
import { ParticipantHeader } from '@/components/layout/Headers'
import { DossierStack } from '@/components/ui/DossierStack'
import { Status } from '@/components/ui/Status'
import { t } from '@/lib/i18n'
import { useDossier } from '@/lib/dossier'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { getStoredParticipant } from '@/lib/utils'

export function ParticipantLobby() {
  const { slug } = useParams<{ slug: string }>()
  const participant = getStoredParticipant()
  const { broadcastMessage, dismissBroadcast, connected } = useWorkshopChannel(slug)
  const dossier = useDossier(slug)

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <ParticipantHeader broadcastMessage={broadcastMessage} onDismissBroadcast={dismissBroadcast} />

      <main id="main" className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-14 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div style={{ animation: 'rise-in 400ms var(--ease-soft) both' }}>
            <h1 className="font-display text-display text-ink">{t('participant_lobby.waiting_title')}</h1>
            <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-ink-muted">{t('participant_lobby.next')}</p>

            {participant && (
              <dl className="mt-8 max-w-sm rounded-lg border border-line bg-paper-raised">
                <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-3">
                  <dt className="text-meta text-ink-subtle">{t('participant_lobby.your_name')}</dt>
                  <dd className="truncate font-display text-xl text-ink">{participant.display_name}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 px-5 py-3">
                  <dt className="text-meta text-ink-subtle">{t('participant_lobby.your_role')}</dt>
                  <dd className="truncate text-sm font-medium text-ink">{participant.role}</dd>
                </div>
              </dl>
            )}

            <Status tone={connected ? 'done' : 'warning'} className="mt-6">
              {connected ? t('participant_lobby.connected') : t('common.reconnecting')}
            </Status>
          </div>

          <DossierStack done={dossier} className="md:justify-self-end" />
        </div>
      </main>
    </div>
  )
}
