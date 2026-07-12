import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { NavBar } from '@/components/layout/NavBar'
import { BroadcastBanner } from '@/components/ui/BroadcastBanner'
import { WorkshopProgress } from '@/components/ui/WorkshopProgress'
import { FloatingReactions } from '@/components/ui/FloatingReactions'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { getStoredParticipant } from '@/lib/utils'
import type { ReactionKind } from '@/types'

function toEmbedUrl(url: string): string {
  const m = url.match(/\/presentation\/d\/([^/]+)/)
  if (!m) return url
  return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=60000`
}

const REACTIONS: { kind: ReactionKind; label: string; emoji: string }[] = [
  { kind: 'emoji_fire', label: t('slides.react_fire'), emoji: '🔥' },
  { kind: 'emoji_heart', label: t('slides.react_heart'), emoji: '❤️' },
  { kind: 'emoji_question', label: t('slides.react_question'), emoji: '❓' },
  { kind: 'raise_hand', label: t('slides.raise_hand'), emoji: '✋' },
]

interface ReactionEvent { id: number; kind: string; name: string }

export function SlidesView() {
  const { slug } = useParams<{ slug: string }>()
  const [slidesUrl, setSlidesUrl] = useState<string | null>(null)
  const [reactionEvents, setReactionEvents] = useState<ReactionEvent[]>([])
  const [poppingButton, setPoppingButton] = useState<ReactionKind | null>(null)
  const participant = getStoredParticipant()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const reactionIdRef = useRef(0)

  // Control messages (phase nav + broadcast) handled by shared hook
  const { broadcastMessage, dismissBroadcast } = useWorkshopChannel(slug)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/v1/sessions/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s?.slides_url) setSlidesUrl(s.slides_url) })
      .catch(() => {})
  }, [slug])

  // Separate subscription on the same channel for reactions (send + receive)
  useEffect(() => {
    if (!slug) return
    const ch = supabase.channel(`session-control-${slug}`)
    ch.on('broadcast', { event: 'reaction' }, ({ payload }: { payload: { kind: string; name: string } }) => {
      const id = ++reactionIdRef.current
      setReactionEvents(prev => [...prev.slice(-20), { id, kind: payload.kind, name: payload.name }])
    }).subscribe()
    channelRef.current = ch
    return () => { supabase.removeChannel(ch); channelRef.current = null }
  }, [slug])

  function sendReaction(kind: ReactionKind) {
    const name = participant?.display_name ?? 'You'
    const id = ++reactionIdRef.current
    setReactionEvents(prev => [...prev.slice(-20), { id, kind, name }])
    setPoppingButton(kind)
    setTimeout(() => setPoppingButton(null), 400)
    channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { kind, name } })
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-faint">
      <NavBar />
      <BroadcastBanner message={broadcastMessage} onDismiss={dismissBroadcast} />
      <WorkshopProgress />

      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          {slidesUrl ? (
            <iframe
              src={toEmbedUrl(slidesUrl)}
              className="h-full w-full"
              style={{ minHeight: 'calc(100vh - 10rem)' }}
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin allow-popups"
              referrerPolicy="no-referrer"
              title={t('slides.title')}
            />
          ) : (
            <div className="flex h-full items-center justify-center py-32">
              <p className="text-sm text-ink-muted">{t('slides.waiting_for_facilitator')}</p>
            </div>
          )}
        </div>

        {/* Reaction bar */}
        <div className="border-t border-border bg-surface px-6 py-3">
          <div className="mx-auto flex max-w-lg items-center justify-center gap-3">
            {REACTIONS.map(({ kind, label, emoji }) => (
              <button
                key={kind}
                onClick={() => sendReaction(kind)}
                style={poppingButton === kind ? { animation: 'reaction-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1)' } : undefined}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface-1 px-4 py-2 text-sm text-ink-muted transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 active:scale-95"
              >
                <span aria-hidden="true">{emoji}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <FloatingReactions events={reactionEvents} />
    </div>
  )
}
