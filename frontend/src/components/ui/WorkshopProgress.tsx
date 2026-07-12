import { useLocation } from 'react-router-dom'

const ROUTE_STEP: Record<string, number> = {
  lobby: 0,
  slides: 1,
  persona: 2,
  'user-flow': 3,
  'problem-board': 4,
  'stakeholder-map': 5,
  launching: 6,
}

const STEP_LABELS = ['Lobby', 'Intro', 'Persona', 'User Flow', 'Problems', 'Network', 'Done']
const TOTAL = 7

export function WorkshopProgress() {
  const { pathname } = useLocation()
  const segment = pathname.split('/').pop() ?? ''
  const step = ROUTE_STEP[segment] ?? 0

  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface-1 px-6 py-2">
      <div className="flex flex-1 items-center gap-0.5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-1 flex-1 rounded-full transition-all duration-500',
              i < step ? 'bg-brand-500' : i === step ? 'bg-brand-400' : 'bg-border',
            ].join(' ')}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
        {step + 1} / {TOTAL} · {STEP_LABELS[step]}
      </span>
    </div>
  )
}
