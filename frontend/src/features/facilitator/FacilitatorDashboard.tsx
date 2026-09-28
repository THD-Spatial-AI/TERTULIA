import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, ChevronDown, Search, Trash2 } from 'lucide-react'
import { FacilitatorHeader } from '@/components/layout/Headers'
import { buttonClasses } from '@/components/ui/Button'
import { Status } from '@/components/ui/Status'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { field } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'
import { t, useLang } from '@/lib/i18n'
import { getMe } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { phaseLabel, phaseTone, useDateFormat } from './phase'
import type { Session } from '@/types'

export function FacilitatorDashboard() {
  useLang()
  const navigate = useNavigate()
  const dateFmt = useDateFormat()
  const [checking, setChecking] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [search, setSearch] = useState('')
  const [showFinished, setShowFinished] = useState(false)
  const [userEmail, setUserEmail] = useState<string>()

  useEffect(() => {
    getMe().then((me) => {
      if (!me?.authenticated) { navigate('/facilitator/login', { replace: true }); return }
      setUserEmail(me.email)
      setChecking(false)
      setLoadingList(true)
      apiFetch<Session[]>('/api/v1/sessions')
        .then(setSessions)
        .catch(() => {})
        .finally(() => setLoadingList(false))
    })
  }, [navigate])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? sessions.filter(s => s.title.toLowerCase().includes(q) || s.workshop_tag.toLowerCase().includes(q))
      : sessions
  }, [sessions, search])

  const isLive = (s: Session) => s.phase !== 'lobby' && s.phase !== 'launched'
  const live = filtered.filter(isLive)
  const upcoming = filtered.filter(s => s.phase === 'lobby')
  const finished = filtered.filter(s => s.phase === 'launched')
  const finishedOpen = showFinished || search.trim() !== ''

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/v1/sessions/${id}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success(t('facilitator.session_deleted'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    }
  }

  if (checking) return null

  const newSession = (
    <Link to="/facilitator/new" className={buttonClasses('primary', 'sm')}>
      {t('facilitator.new_session_button')}
    </Link>
  )

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FacilitatorHeader userEmail={userEmail} action={newSession} />

      <main id="main" className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-display text-ink">{t('facilitator.dashboard_title')}</h1>
              {sessions.length > 0 && (
                <p className="mt-2 text-sm text-ink-muted tabular-nums">
                  {t('dashboard.summary', { total: sessions.length, live: sessions.filter(isLive).length })}
                </p>
              )}
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              {sessions.length > 0 && (
                <div className="relative flex-1 sm:w-64 sm:flex-none">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
                  <input
                    type="search"
                    name="search"
                    autoComplete="off"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('facilitator.search_placeholder')}
                    aria-label={t('dashboard.search_label')}
                    className={cn(field, 'h-9 pl-9')}
                  />
                </div>
              )}
              <div className="sm:hidden">{newSession}</div>
            </div>
          </div>

          <div className="mt-10">
            {loadingList ? (
              <div className="flex justify-center py-24"><Spinner /></div>
            ) : sessions.length === 0 ? (
              <EmptyState
                title={t('facilitator.no_sessions')}
                body={t('facilitator.no_sessions_hint')}
                action={<Link to="/facilitator/new" className={buttonClasses('primary')}>{t('facilitator.new_session_button')}</Link>}
              />
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink-muted">{t('facilitator.no_sessions_match')}</p>
            ) : (
              <div className="space-y-12">
                {live.length > 0 && (
                  <section aria-labelledby="live-heading">
                    <h2 id="live-heading" className="mb-4 text-heading font-semibold text-ink">{t('dashboard.live_now')}</h2>
                    <ul className="space-y-3">
                      {live.map(s => (
                        <li key={s.id} className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-line-strong bg-paper-raised p-5 sm:p-6">
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-title break-words text-ink">{s.title}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <Status tone="live">{t('dashboard.now_at', { phase: phaseLabel(s.phase) })}</Status>
                              <span className="font-mono text-meta text-ink-subtle" translate="no">{s.workshop_tag}</span>
                            </div>
                          </div>
                          <Link to={`/facilitator/session/${s.id}`} className={buttonClasses('primary')}>
                            {t('dashboard.resume')}
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {upcoming.length > 0 && (
                  <section aria-labelledby="upcoming-heading">
                    <h2 id="upcoming-heading" className="mb-4 text-heading font-semibold text-ink">{t('dashboard.not_started')}</h2>
                    <SessionRows sessions={upcoming} dateFmt={dateFmt} onDelete={handleDelete} />
                  </section>
                )}

                {finished.length > 0 && (
                  <section aria-labelledby="finished-heading">
                    <h2 id="finished-heading">
                      <button
                        type="button"
                        onClick={() => setShowFinished(v => !v)}
                        aria-expanded={finishedOpen}
                        aria-controls="finished-list"
                        className="flex items-center gap-2 text-heading font-semibold text-ink transition-colors hover:text-clay-700"
                      >
                        {t('dashboard.finished')}
                        <span className="text-sm font-normal text-ink-subtle tabular-nums">{finished.length}</span>
                        <ChevronDown
                          className={cn('h-4 w-4 text-ink-subtle transition-transform duration-200', !finishedOpen && '-rotate-90')}
                          aria-hidden="true"
                        />
                      </button>
                    </h2>
                    {finishedOpen && (
                      <div id="finished-list" className="mt-4">
                        <SessionRows sessions={finished} dateFmt={dateFmt} onDelete={handleDelete} />
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

interface RowsProps {
  sessions: Session[]
  dateFmt: Intl.DateTimeFormat
  onDelete: (id: string) => void
}

function SessionRows({ sessions, dateFmt, onDelete }: RowsProps) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {sessions.map(s => (
        <li key={s.id} className="group flex items-center gap-4 py-1">
          <Link
            to={`/facilitator/session/${s.id}`}
            className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-5 gap-y-1 rounded-md py-3 pr-2"
          >
            <span className="min-w-0 truncate text-[1.0625rem] font-medium text-ink transition-colors group-hover:text-clay-700">{s.title}</span>
            <span className="font-mono text-meta text-ink-subtle" translate="no">{s.workshop_tag}</span>
            <span className="text-meta text-ink-subtle sm:ml-auto">
              {t('dashboard.created', { date: dateFmt.format(new Date(s.created_at)) })}
            </span>
          </Link>
          <Status tone={phaseTone(s.phase)} className="hidden w-28 md:inline-flex">{phaseLabel(s.phase)}</Status>
          <ConfirmButton
            onConfirm={() => onDelete(s.id)}
            confirmLabel={t('facilitator.confirm_remove')}
            aria-label={`${t('facilitator.delete_session')}: ${s.title}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </ConfirmButton>
        </li>
      ))}
    </ul>
  )
}
