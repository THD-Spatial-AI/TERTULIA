import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ParticipantHeader } from '@/components/layout/Headers'
import { FloatingReactions } from '@/components/ui/FloatingReactions'
import { Flame, Heart, CircleHelp, Hand, type LucideIcon } from 'lucide-react'
import { t, useLang } from '@/lib/i18n'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { toEmbedUrl } from '@/lib/slides'
import { getStoredParticipant } from '@/lib/utils'
import type { ReactionKind } from '@/types'


const REACTIONS: { kind: ReactionKind; labelKey: string; Icon: LucideIcon }[] = [
  { kind: 'emoji_fire', labelKey: 'slides.react_fire', Icon: Flame },
  { kind: 'emoji_heart', labelKey: 'slides.react_heart', Icon: Heart },
  { kind: 'emoji_question', labelKey: 'slides.react_question', Icon: CircleHelp },
  { kind: 'raise_hand', labelKey: 'slides.raise_hand', Icon: Hand },
]

interface ReactionEvent { id: number; kind: string; name: string }

export function SlidesView() {
  useLang()
  const { slug } = useParams<{ slug: string }>()
  const [slidesUrl, setSlidesUrl] = useState<string | null>(null)
  const [reactionEvents, setReactionEvents] = useState<ReactionEvent[]>([])
  const [poppingButton, setPoppingButton] = useState<ReactionKind | null>(null)
  const participant = getStoredParticipant()
  const reactionIdRef = useRef(0)

  const handleReaction = useCallback(({ kind, name }: { kind: string; name: string }) => {
    const id = ++reactionIdRef.current
    setReactionEvents(prev => [...prev.slice(-20), { id, kind, name }])
  }, [])

  const { broadcastMessage, dismissBroadcast, sendMessage } = useWorkshopChannel(slug, {
    onReaction: handleReaction,
  })

  useEffect(() => {
    if (!slug) return
    fetch(`/api/v1/sessions/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s?.slides_url) setSlidesUrl(s.slides_url) })
      .catch(() => {})
  }, [slug])

  function sendReaction(kind: ReactionKind) {
    const name = participant?.display_name ?? 'You'
    sendMessage({ type: 'reaction', kind, name })
    setPoppingButton(kind)
    setTimeout(() => setPoppingButton(null), 400)
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <ParticipantHeader broadcastMessage={broadcastMessage} onDismissBroadcast={dismissBroadcast} />

      <main id="main" className="relative flex flex-1 flex-col px-3 pt-3 pb-24 sm:px-6 sm:pt-6">
        {slidesUrl ? (
          <div className="mx-auto w-full max-w-6xl flex-1 overflow-hidden rounded-xl border border-line bg-paper-raised">
            <iframe
              src={toEmbedUrl(slidesUrl)}
              className="block aspect-video h-auto w-full"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin allow-popups"
              referrerPolicy="no-referrer"
              title={t('slides.title')}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-display text-title text-ink-muted">{t('slides.waiting_for_facilitator')}</p>
          </div>
        )}

        {/* Reaction dock */}
        <div
          role="group"
          aria-label={t('slides.reactions_label')}
          className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-1 rounded-full border border-line bg-paper-raised/95 p-1.5 shadow-float backdrop-blur"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          {REACTIONS.map(({ kind, labelKey, Icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() => sendReaction(kind)}
              aria-label={t(labelKey)}
              style={poppingButton === kind ? { animation: 'reaction-pop 0.4s var(--ease-soft)' } : undefined}
              className="group flex h-11 items-center gap-2 rounded-full px-3.5 text-sm text-ink-muted transition-colors hover:bg-paper-sunk hover:text-ink active:bg-clay-50 active:text-clay-700"
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden md:inline" aria-hidden="true">{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </main>

      <FloatingReactions events={reactionEvents} />
    </div>
  )
}
