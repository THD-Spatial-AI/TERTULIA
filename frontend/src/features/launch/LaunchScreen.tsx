import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { redirectToWildfire } from '@/lib/utils'
import type { ControlMessage } from '@/types'

export function LaunchScreen() {
  const { slug } = useParams<{ slug: string }>()

  useEffect(() => {
    if (!slug) return

    // If we land here after the launch event was already broadcast, resolve the
    // authoritative wildfire_url from the backend (never from a broadcast).
    void redirectToWildfire(slug)

    // Also listen in case we arrive just before the broadcast fires. The
    // payload only triggers a re-fetch; it never supplies the redirect target.
    const channel = supabase.channel(`session-control-${slug}`)
    channel.on('broadcast', { event: 'control' }, ({ payload }: { payload: ControlMessage }) => {
      if (payload.type === 'launch') {
        void redirectToWildfire(slug)
      }
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [slug])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-950 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-fire-600/40 bg-fire-600/10">
        <span className="text-4xl" role="img" aria-label="fire">🔥</span>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-white">{t('launch.title')}</h1>
        <p className="mt-2 text-sm text-brand-400">{t('launch.subtitle')}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fire-500" />
        <span className="text-xs text-brand-500">{t('launch.redirecting')}</span>
      </div>
    </div>
  )
}
