import { useEffect, useState } from 'react'
import { t } from '@/lib/i18n'

// Client-side record of which activities this participant has finished, per session.
// Purely visual (drives the dossier stack); the backend remains the source of truth.

export type Activity = 'persona' | 'user-flow' | 'problem-board' | 'stakeholder-map'

export const ACTIVITIES: Activity[] = ['persona', 'user-flow', 'problem-board', 'stakeholder-map']

const LABEL_KEY: Record<Activity, string> = {
  persona: 'dossier.persona',
  'user-flow': 'dossier.user_flow',
  'problem-board': 'dossier.problem_board',
  'stakeholder-map': 'dossier.stakeholder_map',
}

export function activityLabel(activity: Activity): string {
  return t(LABEL_KEY[activity])
}

const storageKey = (slug: string) => `tertulia_dossier_${slug}`
const listeners = new Set<() => void>()

export function getDossier(slug: string | undefined): Activity[] {
  if (!slug) return []
  try {
    const raw = localStorage.getItem(storageKey(slug))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return ACTIVITIES.filter(a => parsed.includes(a))
  } catch {
    return []
  }
}

export function markActivityDone(slug: string | undefined, activity: Activity) {
  if (!slug) return
  const done = getDossier(slug)
  if (done.includes(activity)) return
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify([...done, activity]))
  } catch {
    // Storage unavailable (private mode): the dossier just won't persist.
  }
  listeners.forEach(fn => fn())
}

export function useDossier(slug: string | undefined): Activity[] {
  const [done, setDone] = useState(() => getDossier(slug))
  useEffect(() => {
    const sync = () => setDone(getDossier(slug))
    sync()
    listeners.add(sync)
    window.addEventListener('storage', sync)
    return () => {
      listeners.delete(sync)
      window.removeEventListener('storage', sync)
    }
  }, [slug])
  return done
}
