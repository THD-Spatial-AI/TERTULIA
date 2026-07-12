import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { redirectToWildfire } from './utils'
import type { ControlMessage, SessionPhase } from '@/types'

export const PHASE_ROUTES: Record<SessionPhase, string> = {
  lobby: 'lobby',
  slides: 'slides',
  template_1: 'persona',
  template_2: 'user-flow',
  template_3: 'problem-board',
  template_4: 'stakeholder-map',
  launched: 'launching',
}

/**
 * Subscribes to the session control channel.
 * Automatically navigates on phase/launch events.
 * Returns broadcast message state for displaying facilitator announcements.
 */
export function useWorkshopChannel(slug: string | undefined) {
  const navigate = useNavigate()
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const ch = supabase.channel(`session-control-${slug}`)
    ch.on('broadcast', { event: 'control' }, ({ payload }: { payload: ControlMessage }) => {
      if (payload.type === 'phase' && payload.phase)
        navigate(`/session/${slug}/${PHASE_ROUTES[payload.phase]}`, { replace: true })
      // The broadcast only signals "launch happened"; the destination is
      // re-fetched from the backend so a spoofed payload can't redirect users.
      if (payload.type === 'launch')
        void redirectToWildfire(slug)
      if (payload.type === 'broadcast' && payload.message)
        setBroadcastMessage(payload.message)
    }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [slug, navigate])

  return {
    broadcastMessage,
    dismissBroadcast: () => setBroadcastMessage(null),
  }
}
