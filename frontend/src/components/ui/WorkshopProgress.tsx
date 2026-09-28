import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

const STEPS = [
  { segment: 'lobby', key: 'progress.lobby' },
  { segment: 'slides', key: 'progress.slides' },
  { segment: 'persona', key: 'dossier.persona' },
  { segment: 'user-flow', key: 'dossier.user_flow' },
  { segment: 'problem-board', key: 'dossier.problem_board' },
  { segment: 'stakeholder-map', key: 'dossier.stakeholder_map' },
  { segment: 'launching', key: 'progress.launching' },
] as const

export function WorkshopProgress() {
  const { pathname } = useLocation()
  const segment = pathname.split('/').pop() ?? ''
  const current = Math.max(0, STEPS.findIndex(s => s.segment === segment))
  const currentLabel = t(STEPS[current].key)

  return (
    <nav aria-label={t('progress.label')} className="border-b border-line bg-paper">
      {/* Mobile: one line + rule */}
      <div className="flex items-center gap-3 px-4 py-2.5 sm:hidden">
        <p className="shrink-0 text-meta text-ink-muted">
          <span className="tabular-nums">{t('progress.step', { n: current + 1, total: STEPS.length })}</span>
          <span aria-hidden="true"> · </span>
          <span className="font-medium text-ink">{currentLabel}</span>
        </p>
        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div
            className="h-full origin-left bg-clay-600 transition-transform duration-500 ease-soft"
            style={{ transform: `scaleX(${(current + 1) / STEPS.length})` }}
          />
        </div>
      </div>

      {/* Desktop: every step named */}
      <ol className="mx-auto hidden max-w-screen-2xl items-center gap-2 px-6 sm:flex">
        {STEPS.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'next'
          return (
            <li key={step.segment} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'relative py-2.5 text-meta whitespace-nowrap transition-colors',
                  state === 'done' && 'text-ink-muted',
                  state === 'current' && 'font-medium text-ink after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-clay-600',
                  state === 'next' && 'text-ink-subtle',
                )}
              >
                {t(step.key)}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={cn('h-px flex-1', i < current ? 'bg-ink-faint' : 'bg-line')}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
