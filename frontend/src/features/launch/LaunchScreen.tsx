import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { DossierStack } from '@/components/ui/DossierStack'
import { t, useLang } from '@/lib/i18n'
import { useDossier } from '@/lib/dossier'
import { redirectToWildfire } from '@/lib/utils'

/** The hand-off: the participant's dossier leaves the table with them. */
export function LaunchScreen() {
  useLang()
  const { slug } = useParams<{ slug: string }>()
  const dossier = useDossier(slug)

  useEffect(() => {
    if (!slug) return
    void redirectToWildfire(slug)
  }, [slug])

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-paper">
      <header className="flex h-14 items-center px-4 sm:px-6">
        <Wordmark to={null} />
      </header>
      <main id="main" className="flex flex-1 flex-col items-center justify-center gap-12 px-4 pb-16 text-center sm:px-6">
        <DossierStack done={dossier} handingOff />
        <div role="status">
          <h1 className="font-display text-display text-ink">{t('launch.title')}</h1>
          <p className="mx-auto mt-3 max-w-md text-[1.0625rem] text-ink-muted">{t('launch.handoff')}</p>
          <p className="mt-6 text-meta text-ink-subtle">{t('launch.redirecting')}</p>
        </div>
      </main>
    </div>
  )
}
