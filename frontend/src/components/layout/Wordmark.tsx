import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

/** "tertulia", set lowercase in Instrument Serif italic. Links home unless `to` is null. */
export function Wordmark({ to = '/', className }: { to?: string | null; className?: string }) {
  const mark = (
    <span translate="no" className={cn('font-display text-[1.625rem] leading-none italic tracking-tight text-ink', className)}>
      tertulia
    </span>
  )
  if (to === null) return mark
  return (
    <Link to={to} className="rounded-sm" aria-label="Tertulia">
      {mark}
    </Link>
  )
}

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-paper"
    >
      {t('nav.skip')}
    </a>
  )
}
