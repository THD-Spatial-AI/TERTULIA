import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ParticipantHeader } from '@/components/layout/Headers'
import { DossierStack } from './DossierStack'
import { Status } from './Status'
import { t } from '@/lib/i18n'
import { activityLabel, markActivityDone, useDossier, type Activity } from '@/lib/dossier'

interface CompletedScreenProps {
  activity: Activity
  broadcastMessage: string | null
  onDismissBroadcast: () => void
  connected?: boolean
}

/** Shown when an activity is finished: its card lands on the participant's dossier. */
export function CompletedScreen({ activity, broadcastMessage, onDismissBroadcast, connected = true }: CompletedScreenProps) {
  const { slug } = useParams<{ slug: string }>()
  const dossier = useDossier(slug)

  useEffect(() => { markActivityDone(slug, activity) }, [slug, activity])

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <ParticipantHeader broadcastMessage={broadcastMessage} onDismissBroadcast={onDismissBroadcast} />
      <main id="main" className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-14 text-center sm:px-6">
        <DossierStack done={dossier} highlight={activity} />
        <div role="status">
          <h1 className="font-display text-display text-ink">
            {activityLabel(activity)} <span className="text-ink-muted">{t('completed.landed')}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-ink-muted">{t('completed.waiting')}</p>
        </div>
        <Status tone={connected ? 'done' : 'warning'}>
          {connected ? t('completed.connected') : t('common.reconnecting')}
        </Status>
      </main>
    </div>
  )
}
