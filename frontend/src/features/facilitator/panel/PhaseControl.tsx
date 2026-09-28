import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { phaseLabel } from '../phase'
import { PHASE_ORDER, formatElapsed, getNextPhase, getPrevPhase, nextPhaseLabel, phaseHint } from './phases'
import type { SessionPhase } from '@/types'

interface PhaseControlProps {
  phase: SessionPhase
  hasSlides: boolean
  elapsed: number
  /** Completion of the current activity, when it has one. */
  progress: { done: number; total: number } | null
  advancing: boolean
  goingBack: boolean
  onAdvance: () => void
  onBack: () => void
}

/** The heart of the panel: where the room is now, and the one button that moves it on. */
export function PhaseControl({ phase, hasSlides, elapsed, progress, advancing, goingBack, onAdvance, onBack }: PhaseControlProps) {
  const steps = PHASE_ORDER.filter(p => hasSlides || p !== 'slides')
  const current = steps.indexOf(phase)
  const next = getNextPhase(phase, hasSlides)
  const prev = getPrevPhase(phase, hasSlides)
  const launched = phase === 'launched'

  return (
    <section aria-labelledby="phase-heading" className="rounded-xl border border-line-strong bg-paper-raised">
      <ol className="flex gap-1 overflow-x-auto border-b border-line px-5 pt-4 sm:px-7">
        {steps.map((p, i) => (
          <li
            key={p}
            aria-current={i === current ? 'step' : undefined}
            className={cn(
              'relative shrink-0 px-2 pb-3 text-meta whitespace-nowrap first:pl-0',
              i < current && 'text-ink-muted',
              i === current && 'font-medium text-ink after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:bg-clay-600 first:after:left-0',
              i > current && 'text-ink-subtle',
            )}
          >
            {phaseLabel(p)}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-end justify-between gap-6 px-5 py-6 sm:px-7 sm:py-8">
        <div className="min-w-0 max-w-xl">
          <p className="text-meta text-ink-subtle">
            {t('facilitator.current_phase')}
            {!launched && <span className="tabular-nums"> · {formatElapsed(elapsed)} {t('facilitator.in_phase')}</span>}
          </p>
          <h2 id="phase-heading" className="mt-1 font-display text-display text-ink">
            {launched ? t('facilitator.launched_title') : phaseLabel(phase)}
          </h2>
          <p className="mt-2 text-[0.9375rem] text-ink-muted">
            {launched ? t('facilitator.launched_body') : phaseHint(phase)}
          </p>

          {progress && progress.total > 0 && (
            <div className="mt-5 flex max-w-sm items-center gap-3">
              <div
                className="h-1 flex-1 overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.total}
                aria-valuenow={progress.done}
                aria-label={t('facilitator.done_count', { done: progress.done, total: progress.total })}
              >
                <div
                  className="h-full origin-left bg-clay-600 transition-transform duration-500 ease-soft"
                  style={{ transform: `scaleX(${progress.done / progress.total})` }}
                />
              </div>
              <span className="shrink-0 text-meta text-ink-muted tabular-nums">
                {t('facilitator.done_count', { done: progress.done, total: progress.total })}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {prev && (
            <Button variant="ghost" onClick={onBack} loading={goingBack} disabled={advancing}>
              {!goingBack && <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              {t('panel.back_to', { phase: phaseLabel(prev) })}
            </Button>
          )}
          {next && (
            <Button size="lg" onClick={onAdvance} loading={advancing} disabled={goingBack}>
              {nextPhaseLabel(phase, hasSlides)}
              {!advancing && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
