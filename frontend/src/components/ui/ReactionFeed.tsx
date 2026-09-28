import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

const EMOJI: Record<string, string> = {
  emoji_fire: '🔥',
  emoji_heart: '❤️',
  emoji_question: '❓',
  raise_hand: '✋',
}

interface ReactionCard {
  id: number
  kind: string
  name: string
  exiting: boolean
}

interface ReactionFeedProps {
  events: { id: number; kind: string; name: string }[]
}

export function ReactionFeed({ events }: ReactionFeedProps) {
  const [cards, setCards] = useState<ReactionCard[]>([])
  const seenIds = useRef(new Set<number>())
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const latest = events[events.length - 1]
    if (!latest || seenIds.current.has(latest.id)) return

    seenIds.current.add(latest.id)
    setCards(prev => [...prev.slice(-6), { ...latest, exiting: false }])

    // Mark exiting after 4 s, remove 400 ms later
    const exitTimer = setTimeout(() => {
      setCards(prev => prev.map(c => c.id === latest.id ? { ...c, exiting: true } : c))
      const removeTimer = setTimeout(() => {
        setCards(prev => prev.filter(c => c.id !== latest.id))
        timers.current.delete(latest.id)
      }, 400)
      timers.current.set(latest.id, removeTimer)
    }, 4000)

    timers.current.set(latest.id, exitTimer)
  }, [events])

  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const isRaiseHand = (kind: string) => kind === 'raise_hand'

  return (
    <div
      className="pointer-events-none fixed bottom-8 right-6 z-50 flex flex-col-reverse gap-3"
      aria-live="polite"
      aria-label={t('slides.reactions_label')}
    >
      {cards.map(card => (
        <div
          key={card.id}
          style={
            card.exiting
              ? {
                  opacity: 0,
                  transform: 'translateX(110%) scale(0.85)',
                  transition: 'opacity 0.35s ease-in, transform 0.35s cubic-bezier(0.4, 0, 1, 1)',
                }
              : {
                  animation: 'reaction-enter 0.42s var(--ease-soft) forwards',
                }
          }
          className={cn(
            'relative flex items-center gap-3 rounded-lg bg-ink py-3 pr-4 pl-3 text-paper shadow-float',
            isRaiseHand(card.kind) && 'border-l-4 border-clay-500',
          )}
        >
          <span className="text-3xl leading-none" aria-hidden="true">
            {EMOJI[card.kind] ?? '💬'}
          </span>
          <div className="min-w-0">
            <p className="max-w-40 truncate text-sm leading-tight font-medium">{card.name}</p>
            <p className="mt-0.5 text-meta leading-tight text-paper/70">{t(`reaction_feed.${card.kind}`)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
