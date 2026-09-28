import { useMemo } from 'react'
import { t, useLang } from '@/lib/i18n'
import type { StatusTone } from '@/components/ui/Status'

export function phaseLabel(phase: string): string {
  const key = `facilitator.phase_${phase}`
  const label = t(key)
  return label === key ? phase : label
}

export function phaseTone(phase: string): StatusTone {
  if (phase === 'launched') return 'done'
  if (phase === 'lobby') return 'idle'
  return 'live'
}

/** Date formatter in the app's selected language (not the browser default). */
export function useDateFormat(options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const lang = useLang()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => new Intl.DateTimeFormat(lang, options), [lang])
}
