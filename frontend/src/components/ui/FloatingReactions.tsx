import { useEffect, useRef, useState } from 'react'

const EMOJI: Record<string, string> = {
  emoji_fire: '🔥',
  emoji_heart: '❤️',
  emoji_question: '❓',
  raise_hand: '✋',
}

// Vary size per reaction type for visual hierarchy
const SIZE: Record<string, string> = {
  emoji_fire: 'text-5xl',
  emoji_heart: 'text-4xl',
  emoji_question: 'text-4xl',
  raise_hand: 'text-5xl',
}

interface Bubble {
  id: number
  kind: string
  name: string
  left: number
}

interface FloatingReactionsProps {
  events: { id: number; kind: string; name: string }[]
}

const DURATION_MS = 3600

export function FloatingReactions({ events }: FloatingReactionsProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  // Track IDs we've already processed so re-renders don't re-add
  const seenIds = useRef(new Set<number>())
  // Timers stored outside effect cleanup so new events don't cancel old timers
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const latest = events[events.length - 1]
    if (!latest || seenIds.current.has(latest.id)) return

    seenIds.current.add(latest.id)
    const left = 12 + Math.random() * 76
    setBubbles(prev => [...prev.slice(-14), { ...latest, left }])

    const timer = setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== latest.id))
      timers.current.delete(latest.id)
    }, DURATION_MS + 200)

    timers.current.set(latest.id, timer)
  }, [events])

  // Clear all timers on unmount
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  if (bubbles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute bottom-24 flex flex-col items-center gap-1.5"
          style={{
            left: `${bubble.left}%`,
            animation: `float-up ${DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          }}
        >
          <span
            className={`leading-none drop-shadow-xl ${SIZE[bubble.kind] ?? 'text-4xl'}`}
            style={{ filter: 'drop-shadow(0 4px 12px oklch(0 0 0 / 0.4))' }}
          >
            {EMOJI[bubble.kind] ?? '💬'}
          </span>
          <span className="whitespace-nowrap rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {bubble.name}
          </span>
        </div>
      ))}
    </div>
  )
}
