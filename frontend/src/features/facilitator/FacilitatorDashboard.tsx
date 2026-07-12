import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import type { Session } from '@/types'

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    lobby: t('facilitator.phase_lobby'),
    slides: t('facilitator.phase_slides'),
    template_1: t('facilitator.phase_template_1'),
    template_2: t('facilitator.phase_template_2'),
    template_3: t('facilitator.phase_template_3'),
    template_4: t('facilitator.phase_template_4'),
    launched: t('facilitator.phase_launched'),
  }
  return map[phase] ?? phase
}

const PHASE_VARIANT: Record<string, 'neutral' | 'brand' | 'fire' | 'success'> = {
  lobby: 'neutral',
  slides: 'brand',
  template_1: 'brand',
  template_2: 'brand',
  template_3: 'brand',
  template_4: 'brand',
  launched: 'success',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function FacilitatorDashboard() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate('/facilitator/login', { replace: true }); return }
      setUserEmail(data.session.user.email)
      setChecking(false)
      setLoadingList(true)
      apiFetch<Session[]>('/api/v1/sessions')
        .then(setSessions)
        .catch(() => {})
        .finally(() => setLoadingList(false))
    })
  }, [navigate])

  const stats = useMemo(() => ({
    total: sessions.length,
    active: sessions.filter(s => s.phase !== 'lobby' && s.phase !== 'launched').length,
    launched: sessions.filter(s => s.phase === 'launched').length,
  }), [sessions])

  const filtered = useMemo(() =>
    search.trim()
      ? sessions.filter(s =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.workshop_tag.toLowerCase().includes(search.toLowerCase()),
        )
      : sessions,
    [sessions, search],
  )

  async function handleDelete(id: string) {
    if (deletingId !== id) {
      setDeletingId(id)
      setTimeout(() => setDeletingId(prev => prev === id ? null : prev), 3000)
      return
    }
    setDeletingId(null)
    try {
      await apiFetch(`/api/v1/sessions/${id}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success(t('facilitator.session_deleted'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    }
  }

  if (checking) return null

  return (
    <div className="flex min-h-screen flex-col bg-surface-faint">
      <NavBar
        showSignOut
        showFacilitatorNav
        userEmail={userEmail}
        right={
          <Link to="/facilitator/new">
            <Button variant="brand" size="sm">{t('facilitator.new_session_button')}</Button>
          </Link>
        }
      />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-ink">{t('facilitator.dashboard_title')}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t('facilitator.dashboard_subtitle')}</p>
          </div>

          {/* Stats row */}
          {sessions.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[
                { label: t('facilitator.stats_total'), value: stats.total },
                { label: t('facilitator.stats_active'), value: stats.active },
                { label: t('facilitator.stats_launched'), value: stats.launched },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-border bg-surface px-5 py-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          )}

          {loadingList ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-24 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-1">
                <svg className="h-6 w-6 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h2 className="mt-4 text-base font-medium text-ink">{t('facilitator.no_sessions')}</h2>
              <p className="mt-1.5 max-w-xs text-sm text-ink-muted">{t('facilitator.no_sessions_hint')}</p>
              <div className="mt-6">
                <Link to="/facilitator/new">
                  <Button variant="brand">{t('facilitator.new_session_button')}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="mb-4">
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('facilitator.search_placeholder')}
                />
              </div>

              {/* Session list */}
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-ink-muted">{t('facilitator.no_sessions_match')}</p>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                  {filtered.map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-surface-1"
                    >
                      <Link
                        to={`/facilitator/session/${session.id}`}
                        className="flex min-w-0 flex-1 items-center gap-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{session.title}</p>
                          <p className="mt-0.5 font-mono text-xs text-ink-subtle">{session.workshop_tag}</p>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-4 pr-2">
                          <Badge variant={PHASE_VARIANT[session.phase] ?? 'neutral'}>
                            {phaseLabel(session.phase)}
                          </Badge>
                          <span className="text-xs text-ink-subtle">{formatDate(session.created_at)}</span>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className={[
                          'shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                          deletingId === session.id
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'text-ink-subtle hover:bg-surface-2 hover:text-ink',
                        ].join(' ')}
                      >
                        {deletingId === session.id ? t('facilitator.confirm_remove') : t('facilitator.delete_session')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
