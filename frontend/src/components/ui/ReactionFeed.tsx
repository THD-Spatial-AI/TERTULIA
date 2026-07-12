import { useEffect, useRef, useState } from 'react'

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

  if (cards.length === 0) return null

  const isRaiseHand = (kind: string) => kind === 'raise_hand'

  return (
    <div
      className="pointer-events-none fixed bottom-8 right-6 z-50 flex flex-col-reverse gap-3"
      aria-live="polite"
      aria-label="Participant reactions"
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
                  animation: 'reaction-enter 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }
          }
          className={[
            'flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-sm',
            isRaiseHand(card.kind)
              ? 'border border-fire-600/70 bg-fire-950/95 ring-2 ring-fire-500/25'
              : 'border border-brand-700/60 bg-brand-900/95',
          ].join(' ')}
        >
          {/* Pulse ring for raise_hand to grab attention */}
          {isRaiseHand(card.kind) && !card.exiting && (
            <span
              className="absolute -inset-1 rounded-2xl border border-fire-500/40 animate-ping"
              style={{ animationDuration: '1.6s' }}
              aria-hidden="true"
            />
          )}

          <span className="relative text-4xl leading-none" role="img" aria-label={card.kind}>
            {EMOJI[card.kind] ?? '💬'}
          </span>

          <div className="relative min-w-0">
            <p className={[
              'text-sm font-semibold leading-tight truncate max-w-[160px]',
              isRaiseHand(card.kind) ? 'text-fire-100' : 'text-white',
            ].join(' ')}>
              {card.name}
            </p>
            <p className={[
              'text-xs leading-tight mt-0.5',
              isRaiseHand(card.kind) ? 'text-fire-400' : 'text-brand-400',
            ].join(' ')}>
              {card.kind === 'raise_hand' ? 'raised their hand' :
               card.kind === 'emoji_question' ? 'has a question' :
               card.kind === 'emoji_fire' ? 'reacted 🔥' : 'reacted ❤️'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
