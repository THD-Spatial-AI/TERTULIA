import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { ACTIVITIES, activityLabel, type Activity } from '@/lib/dossier'

const TILT = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3']

interface DossierStackProps {
  done: Activity[]
  /** Card that just landed; it animates in. */
  highlight?: Activity
  /** Whole stack slides away (launch handoff). */
  handingOff?: boolean
  className?: string
}

/** The participant's dossier: one paper card per finished activity, laid on the table. */
export function DossierStack({ done, highlight, handingOff, className }: DossierStackProps) {
  return (
    <figure
      className={cn('flex flex-col items-center', className)}
      aria-label={`${t('dossier.title')}: ${t('dossier.count', { done: done.length, total: ACTIVITIES.length })}`}
    >
      <div
        className="flex items-end justify-center pl-5"
        style={handingOff ? { animation: 'dossier-handoff 900ms var(--ease-soft) 400ms both' } : undefined}
      >
        {ACTIVITIES.map((activity, i) => {
          const isDone = done.includes(activity)
          return (
            <div
              key={activity}
              className={cn(
                '-ml-5 flex h-32 w-24 flex-col justify-between rounded-md p-3 sm:h-36 sm:w-28',
                TILT[i],
                isDone
                  ? 'border border-line-strong bg-paper-raised shadow-float'
                  : 'border border-dashed border-line-strong bg-paper/60',
              )}
              style={{
                zIndex: i,
                // Only once the card is actually done, so the animation starts when it lands.
                animation: isDone && highlight === activity ? 'dossier-land 600ms var(--ease-soft) both' : undefined,
              }}
              aria-hidden="true"
            >
              <span className={cn('h-0.5 w-6 rounded-full', isDone ? 'bg-clay-600' : 'bg-line-strong')} />
              <span className={cn('font-display text-lg leading-tight', isDone ? 'text-ink' : 'text-ink-faint')}>
                {activityLabel(activity)}
              </span>
            </div>
          )
        })}
      </div>
      <figcaption className="mt-5 text-meta text-ink-subtle">
        {done.length === 0
          ? t('dossier.empty')
          : `${t('dossier.title')} · ${t('dossier.count', { done: done.length, total: ACTIVITIES.length })}`}
      </figcaption>
    </figure>
  )
}

/** Header-sized pile: tiny cards, one per finished activity. */
export function DossierPile({ done, className }: { done: Activity[]; className?: string }) {
  const label = `${t('dossier.title')}: ${t('dossier.count', { done: done.length, total: ACTIVITIES.length })}`
  return (
    <span className={cn('inline-flex items-center gap-2', className)} role="img" aria-label={label} title={label}>
      <span className="relative inline-block h-6 w-7" aria-hidden="true">
        {done.length === 0 ? (
          <span className="absolute bottom-0 left-1 h-5 w-4 rounded-[3px] border border-dashed border-line-strong" />
        ) : (
          done.map((activity, i) => (
            <span
              key={activity}
              className="absolute bottom-0 h-5 w-4 rounded-[3px] border border-line-strong bg-paper-raised"
              style={{ left: i * 3, rotate: `${[-6, 3, -2, 5][i]}deg`, zIndex: i, animation: 'rise-in 300ms var(--ease-soft)' }}
            />
          ))
        )}
      </span>
      <span className="text-meta tabular-nums text-ink-muted">
        {done.length}/{ACTIVITIES.length}
      </span>
    </span>
  )
}
