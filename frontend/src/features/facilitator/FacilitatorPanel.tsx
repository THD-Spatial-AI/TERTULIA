import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { ReactionFeed } from '@/components/ui/ReactionFeed'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { apiFetch } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Session, Participant, SessionPhase, ControlMessage, ParticipantCompletion } from '@/types'

const PHASE_ORDER: SessionPhase[] = [
  'lobby', 'slides', 'template_1', 'template_2', 'template_3', 'template_4', 'launched',
]

function phaseLabel(phase: SessionPhase): string {
  const map: Record<SessionPhase, string> = {
    lobby: t('facilitator.phase_lobby'),
    slides: t('facilitator.phase_slides'),
    template_1: t('facilitator.phase_template_1'),
    template_2: t('facilitator.phase_template_2'),
    template_3: t('facilitator.phase_template_3'),
    template_4: t('facilitator.phase_template_4'),
    launched: t('facilitator.phase_launched'),
  }
  return map[phase]
}

function phaseHint(phase: SessionPhase): string {
  const map: Partial<Record<SessionPhase, string>> = {
    lobby: t('facilitator.phase_hint_lobby'),
    slides: t('facilitator.phase_hint_slides'),
    template_1: t('facilitator.phase_hint_template_1'),
    template_2: t('facilitator.phase_hint_template_2'),
    template_3: t('facilitator.phase_hint_template_3'),
    template_4: t('facilitator.phase_hint_template_4'),
  }
  return map[phase] ?? ''
}

function getNextPhase(current: SessionPhase, hasSlides: boolean): SessionPhase | null {
  if (current === 'lobby') return hasSlides ? 'slides' : 'template_1'
  if (current === 'slides') return 'template_1'
  if (current === 'template_1') return 'template_2'
  if (current === 'template_2') return 'template_3'
  if (current === 'template_3') return 'template_4'
  if (current === 'template_4') return 'launched'
  return null
}

function getPrevPhase(current: SessionPhase, hasSlides: boolean): SessionPhase | null {
  if (current === 'lobby') return null
  if (current === 'slides') return 'lobby'
  if (current === 'template_1') return hasSlides ? 'slides' : 'lobby'
  if (current === 'template_2') return 'template_1'
  if (current === 'template_3') return 'template_2'
  if (current === 'template_4') return 'template_3'
  if (current === 'launched') return 'template_4'
  return null
}

function nextPhaseLabel(current: SessionPhase, hasSlides: boolean): string {
  if (current === 'lobby') return hasSlides ? t('facilitator.start_presentation') : t('facilitator.start_workshop')
  if (current === 'slides') return t('facilitator.start_workshop')
  if (current === 'template_1') return t('facilitator.unlock_user_flow')
  if (current === 'template_2') return t('facilitator.unlock_problem_board')
  if (current === 'template_3') return t('facilitator.unlock_stakeholder_map')
  if (current === 'template_4') return t('facilitator.launch_wildfire')
  return ''
}

function toEmbedUrl(url: string): string {
  const m = url.match(/\/presentation\/d\/([^/]+)/)
  if (!m) return url
  return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=60000`
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface ReactionTick {
  id: number
  kind: string
  name: string
}

type PanelTab = 'overview' | 'participants' | 'settings'

const COMPLETION_COLS: { key: keyof ParticipantCompletion; phaseKey: SessionPhase }[] = [
  { key: 'persona', phaseKey: 'template_1' },
  { key: 'user_flow', phaseKey: 'template_2' },
  { key: 'problem_board', phaseKey: 'template_3' },
  { key: 'stakeholder_map', phaseKey: 'template_4' },
]

const PHASE_COMPLETION_KEY: Partial<Record<SessionPhase, keyof ParticipantCompletion>> = {
  template_1: 'persona',
  template_2: 'user_flow',
  template_3: 'problem_board',
  template_4: 'stakeholder_map',
}

export function FacilitatorPanel() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [goingBack, setGoingBack] = useState(false)
  const [reactions, setReactions] = useState<ReactionTick[]>([])
  const [activeTab, setActiveTab] = useState<PanelTab>('overview')
  const [completions, setCompletions] = useState<ParticipantCompletion[]>([])
  const [loadingCompletions, setLoadingCompletions] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [settingsForm, setSettingsForm] = useState({ title: '', slides_url: '', wildfire_url: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [phaseElapsed, setPhaseElapsed] = useState(0)
  const [userEmail, setUserEmail] = useState<string>()

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const reactionIdRef = useRef(0)
  const phaseStartRef = useRef<number>(Date.now())

  const fetchParticipants = useCallback(async (sid: string) => {
    try {
      const list = await apiFetch<Participant[]>(`/api/v1/participants/${sid}`)
      setParticipants(list)
    } catch { /* silent */ }
  }, [])

  const fetchCompletions = useCallback(async (sid: string) => {
    setLoadingCompletions(true)
    try {
      const data = await apiFetch<ParticipantCompletion[]>(`/api/v1/sessions/${sid}/completions`)
      setCompletions(data)
    } catch { /* silent */ }
    finally { setLoadingCompletions(false) }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email)
    })
  }, [])

  useEffect(() => {
    if (!sessionId) return
    apiFetch<Session>(`/api/v1/sessions/id/${sessionId}`)
      .then(s => {
        setSession(s)
        setSettingsForm({ title: s.title, slides_url: s.slides_url ?? '', wildfire_url: s.wildfire_url })
      })
      .catch(() => toast.error(t('facilitator.load_failed')))
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    if (!session) return
    fetchParticipants(session.id)
    const interval = setInterval(() => fetchParticipants(session.id), 10_000)
    return () => clearInterval(interval)
  }, [session, fetchParticipants])

  useEffect(() => {
    if (activeTab === 'participants' && session) {
      fetchCompletions(session.id)
    }
  }, [activeTab, session, fetchCompletions])

  useEffect(() => {
    if (!session) return
    const key = PHASE_COMPLETION_KEY[session.phase]
    if (!key) return
    fetchCompletions(session.id)
    const interval = setInterval(() => fetchCompletions(session.id), 30_000)
    return () => clearInterval(interval)
  }, [session?.id, session?.phase, fetchCompletions])

  useEffect(() => {
    phaseStartRef.current = Date.now()
    setPhaseElapsed(0)
  }, [session?.phase])

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseElapsed(Math.floor((Date.now() - phaseStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!session) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase.channel(`session-control-${session.slug}`)
    ch.on('broadcast', { event: 'reaction' }, ({ payload }: { payload: { kind: string; name: string } }) => {
      const id = ++reactionIdRef.current
      setReactions(prev => [...prev.slice(-19), { id, kind: payload.kind, name: payload.name }])
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 5000)
    })
    ch.subscribe()
    channelRef.current = ch

    return () => { supabase.removeChannel(ch); channelRef.current = null }
  }, [session])

  async function advancePhase() {
    if (!session) return
    const next = getNextPhase(session.phase, !!session.slides_url)
    if (!next) return
    setAdvancing(true)
    try {
      if (next === 'launched') {
        const result = await apiFetch<{ launched: number; pre_registered: number; warning: string | null }>(
          `/api/v1/launch/${session.id}`,
          { method: 'POST' },
        )
        toast.success(t('facilitator.launch_success').replace('{{count}}', String(result.launched)))
        if (result.warning) toast.warning(t('facilitator.launch_warning').replace('{{message}}', result.warning))
        setSession(s => s ? { ...s, phase: 'launched' } : s)
        channelRef.current?.send({
          type: 'broadcast',
          event: 'control',
          payload: { type: 'launch', wildfire_url: session.wildfire_url } satisfies ControlMessage,
        })
      } else {
        const updated = await apiFetch<Session>(`/api/v1/sessions/${session.id}/phase`, {
          method: 'PATCH',
          body: JSON.stringify({ phase: next }),
        })
        setSession(updated)
        channelRef.current?.send({
          type: 'broadcast',
          event: 'control',
          payload: { type: 'phase', phase: next } satisfies ControlMessage,
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setAdvancing(false)
    }
  }

  async function goBackPhase() {
    if (!session) return
    const prev = getPrevPhase(session.phase, !!session.slides_url)
    if (!prev) return
    setGoingBack(true)
    try {
      const updated = await apiFetch<Session>(`/api/v1/sessions/${session.id}/phase`, {
        method: 'PATCH',
        body: JSON.stringify({ phase: prev }),
      })
      setSession(updated)
      channelRef.current?.send({
        type: 'broadcast',
        event: 'control',
        payload: { type: 'phase', phase: prev } satisfies ControlMessage,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setGoingBack(false)
    }
  }

  async function handleRemoveParticipant(participantId: string) {
    if (removingId !== participantId) {
      setRemovingId(participantId)
      setTimeout(() => setRemovingId(prev => prev === participantId ? null : prev), 3000)
      return
    }
    setRemovingId(null)
    try {
      await apiFetch(`/api/v1/participants/${participantId}`, { method: 'DELETE' })
      setParticipants(prev => prev.filter(p => p.id !== participantId))
      setCompletions(prev => prev.filter(c => c.participant_id !== participantId))
      toast.success(t('facilitator.participant_removed'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    }
  }

  async function saveSettings() {
    if (!session) return
    setSavingSettings(true)
    try {
      const updated = await apiFetch<Session>(`/api/v1/sessions/${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: settingsForm.title.trim() || undefined,
          slides_url: settingsForm.slides_url.trim() || null,
          wildfire_url: settingsForm.wildfire_url.trim() || undefined,
        }),
      })
      setSession(updated)
      toast.success(t('facilitator.settings_saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSavingSettings(false)
    }
  }

  function sendBroadcast() {
    if (!broadcastMsg.trim() || !channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'control',
      payload: { type: 'broadcast', message: broadcastMsg.trim() } satisfies ControlMessage,
    })
    toast.success(t('facilitator.broadcast_sent'))
    setBroadcastMsg('')
  }

  function exportCSV() {
    if (!session) return
    const headers = ['Name', 'Role', 'Organisation', 'Joined']
    const rows = participants.map(p => [
      p.display_name, p.role, p.org ?? '', new Date(p.joined_at).toLocaleString(),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.workshop_tag}-participants.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const joinUrl = session ? `${window.location.origin}/session/${session.slug}` : ''

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-faint">
        <NavBar showSignOut showFacilitatorNav userEmail={userEmail} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-faint">
        <NavBar showSignOut showFacilitatorNav userEmail={userEmail} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-ink-muted">{t('errors.session_not_found')}</p>
          <Link to="/facilitator"><Button variant="outline">{t('common.back')}</Button></Link>
        </div>
      </div>
    )
  }

  const nextPhase = getNextPhase(session.phase, !!session.slides_url)
  const prevPhase = getPrevPhase(session.phase, !!session.slides_url)
  const isLaunched = session.phase === 'launched'
  const phaseIndex = PHASE_ORDER.indexOf(session.phase)

  const completionMap = new Map(completions.map(c => [c.participant_id, c]))

  const participantCountStr = participants.length === 1
    ? t('participant_lobby.participants_count_one', { count: '1' })
    : t('participant_lobby.participants_count_other', { count: String(participants.length) })

  return (
    <div className="flex min-h-screen flex-col bg-surface-faint">
      <NavBar showSignOut showFacilitatorNav userEmail={userEmail} />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-sm text-ink-subtle">
                <Link to="/facilitator" className="hover:text-ink transition-colors">
                  {t('facilitator.dashboard_title')}
                </Link>
                <span>/</span>
                <span className="text-ink truncate max-w-xs">{session.title}</span>
              </nav>
              <h1 className="text-xl font-semibold text-ink">{session.title}</h1>
              <div className="mt-2 flex items-center gap-3">
                <Badge variant={isLaunched ? 'success' : session.phase === 'lobby' ? 'neutral' : 'brand'}>
                  {phaseLabel(session.phase)}
                </Badge>
                <span className="font-mono text-xs text-ink-subtle">{session.workshop_tag}</span>
                <span className="text-xs text-ink-subtle">{participantCountStr}</span>
                {!isLaunched && (
                  <span className="text-xs text-ink-subtle tabular-nums">
                    {formatElapsed(phaseElapsed)} {t('facilitator.in_phase')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Phase progress bar */}
          <div className="flex items-center gap-1">
            {PHASE_ORDER.filter(p => p !== 'launched').map((p, i) => (
              <div
                key={p}
                className={[
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i < phaseIndex ? 'bg-brand-500' : i === phaseIndex ? 'bg-brand-400' : 'bg-border',
                ].join(' ')}
                title={phaseLabel(p)}
              />
            ))}
          </div>

          {/* Tab bar */}
          <div className="border-b border-border">
            <nav className="-mb-px flex gap-1">
              {(['overview', 'participants', 'settings'] as PanelTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
                    activeTab === tab
                      ? 'border-brand-500 text-ink'
                      : 'border-transparent text-ink-muted hover:text-ink',
                  )}
                >
                  {t(`facilitator.tab_${tab}`)}
                  {tab === 'participants' && participants.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                      {participants.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">

              {/* Left col */}
              <div className="space-y-5 lg:col-span-1">
                {/* QR / join link */}
                <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-ink">{t('facilitator.session_url_label')}</h2>
                  <div className="flex justify-center rounded-lg border border-border bg-surface-1 p-4">
                    <QRCodeSVG value={joinUrl} size={120} level="M" marginSize={1} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-surface-1 px-2.5 py-1.5 font-mono text-xs text-ink-muted">
                      {joinUrl}
                    </code>
                    <Button variant="secondary" size="sm" onClick={() => {
                      navigator.clipboard.writeText(joinUrl)
                      toast.success(t('facilitator.url_copied'))
                    }}>
                      {t('facilitator.copy_url_button')}
                    </Button>
                  </div>
                </div>

                {/* Quick participant list */}
                <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-ink">
                    {t('facilitator.participants_title')}
                    {participants.length > 0 && (
                      <span className="ml-2 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                        {participants.length}
                      </span>
                    )}
                  </h2>
                  {participants.length === 0 ? (
                    <p className="text-xs text-ink-subtle">{t('facilitator.no_participants')}</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {participants.slice(0, 8).map(p => (
                        <li key={p.id} className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {p.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{p.display_name}</p>
                            <p className="truncate text-xs text-ink-subtle">{p.role}{p.org ? ` · ${p.org}` : ''}</p>
                          </div>
                        </li>
                      ))}
                      {participants.length > 8 && (
                        <li>
                          <button
                            onClick={() => setActiveTab('participants')}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            {t('facilitator.view_all', { count: String(participants.length - 8) })}
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right col */}
              <div className="space-y-5 lg:col-span-2">
                {/* Phase control */}
                {!isLaunched && (
                  <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                          {t('facilitator.current_phase')}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink">{phaseLabel(session.phase)}</p>
                        <p className="mt-1 text-sm text-ink-muted">{phaseHint(session.phase)}</p>
                        {(() => {
                          const key = PHASE_COMPLETION_KEY[session.phase]
                          if (!key || completions.length === 0) return null
                          const done = completions.filter(c => c[key] as boolean).length
                          const total = completions.length
                          return (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-border">
                                <div
                                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                                  style={{ width: `${Math.round((done / total) * 100)}%` }}
                                />
                              </div>
                              <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                                {t('facilitator.done_count', { done: String(done), total: String(total) })}
                              </span>
                            </div>
                          )
                        })()}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {prevPhase && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goBackPhase}
                            loading={goingBack}
                            disabled={advancing}
                          >
                            ← {phaseLabel(prevPhase)}
                          </Button>
                        )}
                        {nextPhase && (
                          <Button
                            variant={nextPhase === 'launched' ? 'fire' : 'brand'}
                            onClick={advancePhase}
                            loading={advancing}
                            disabled={goingBack}
                          >
                            {nextPhaseLabel(session.phase, !!session.slides_url)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isLaunched && (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-brand-800">{t('facilitator.launched_title')}</p>
                        <p className="mt-1 text-sm text-brand-600">{t('facilitator.launched_body')}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBackPhase}
                        loading={goingBack}
                        className="shrink-0"
                      >
                        ← {phaseLabel('template_4')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Slides iframe */}
                {session.phase === 'slides' && session.slides_url && (
                  <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <span className="text-sm font-medium text-ink">{t('facilitator.live_slides')}</span>
                      <a
                        href={session.slides_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:underline"
                      >
                        {t('facilitator.open_in_google_slides')}
                      </a>
                    </div>
                    <div className="aspect-video w-full">
                      <iframe
                        src={toEmbedUrl(session.slides_url)}
                        className="h-full w-full"
                        allow="autoplay"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                        referrerPolicy="no-referrer"
                        title="Presentation slides"
                      />
                    </div>
                  </div>
                )}

                {/* Session info when not in slides */}
                {session.phase !== 'slides' && (
                  <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                    <h2 className="mb-4 text-sm font-semibold text-ink">{t('facilitator.session_details')}</h2>
                    <dl className="grid gap-y-3 gap-x-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-ink-subtle uppercase tracking-wide">
                          {t('facilitator.workshop_tag_dt')}
                        </dt>
                        <dd className="mt-0.5 font-mono text-sm text-ink">{session.workshop_tag}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-subtle uppercase tracking-wide">
                          {t('facilitator.created_label')}
                        </dt>
                        <dd className="mt-0.5 text-sm text-ink">
                          {new Date(session.created_at).toLocaleDateString()}
                        </dd>
                      </div>
                      {session.slides_url && (
                        <div>
                          <dt className="text-xs text-ink-subtle uppercase tracking-wide">
                            {t('facilitator.slides_label')}
                          </dt>
                          <dd className="mt-0.5 text-sm">
                            <a href={session.slides_url} target="_blank" rel="noopener noreferrer"
                              className="text-brand-600 hover:underline">
                              {t('facilitator.open_slides')}
                            </a>
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs text-ink-subtle uppercase tracking-wide">
                          {t('facilitator.wildfire_url_label')}
                        </dt>
                        <dd className="mt-0.5 text-sm">
                          <a href={session.wildfire_url} target="_blank" rel="noopener noreferrer"
                            className="text-brand-600 hover:underline truncate block">
                            {session.wildfire_url}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Participants tab ── */}
          {activeTab === 'participants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-muted">
                  {participantCountStr} · {t('facilitator.template_completion')}
                </p>
                <Button variant="secondary" size="sm" onClick={() => session && fetchCompletions(session.id)}>
                  {t('facilitator.refresh')}
                </Button>
              </div>

              {participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
                  <p className="text-sm text-ink-muted">{t('facilitator.no_participants')}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-surface-1">
                          <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-subtle">
                            {t('facilitator.participant_header')}
                          </th>
                          {COMPLETION_COLS.map(col => (
                            <th key={col.key} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-ink-subtle">
                              {phaseLabel(col.phaseKey)}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-subtle">
                            {t('facilitator.action_header')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {participants.map(p => {
                          const c = completionMap.get(p.id)
                          return (
                            <tr key={p.id} className="hover:bg-surface-1">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                                    {p.display_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-ink">{p.display_name}</p>
                                    <p className="text-xs text-ink-subtle">{p.role}{p.org ? ` · ${p.org}` : ''}</p>
                                  </div>
                                </div>
                              </td>
                              {COMPLETION_COLS.map(col => (
                                <td key={col.key} className="px-4 py-3.5 text-center">
                                  {loadingCompletions ? (
                                    <span className="inline-block h-3 w-3 rounded-full bg-border animate-pulse" />
                                  ) : c ? (
                                    c[col.key]
                                      ? <span className="text-base leading-none text-green-600" title="Completed">✓</span>
                                      : <span className="text-base leading-none text-ink-subtle" title="Not yet">–</span>
                                  ) : (
                                    <span className="text-xs text-ink-subtle">–</span>
                                  )}
                                </td>
                              ))}
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={() => handleRemoveParticipant(p.id)}
                                  className={cn(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                    removingId === p.id
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'text-ink-subtle hover:bg-surface-2 hover:text-ink',
                                  )}
                                >
                                  {removingId === p.id ? t('facilitator.confirm_remove') : t('facilitator.remove_participant')}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Export CSV */}
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={exportCSV} disabled={participants.length === 0}>
                  {t('facilitator.export_csv')}
                </Button>
              </div>
            </div>
          )}

          {/* ── Settings tab ── */}
          {activeTab === 'settings' && (
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Edit session */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <h2 className="mb-5 text-sm font-semibold text-ink">{t('facilitator.tab_settings')}</h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-title">{t('facilitator.session_title_label')}</Label>
                    <Input
                      id="s-title"
                      value={settingsForm.title}
                      onChange={e => setSettingsForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-slides">
                      {t('facilitator.slides_url_label')}
                      <span className="ml-1.5 text-xs font-normal text-ink-subtle">({t('common.optional')})</span>
                    </Label>
                    <Input
                      id="s-slides"
                      type="url"
                      value={settingsForm.slides_url}
                      onChange={e => setSettingsForm(f => ({ ...f, slides_url: e.target.value }))}
                      placeholder={t('facilitator.slides_url_placeholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-wildfire">{t('facilitator.wildfire_url_label')}</Label>
                    <Input
                      id="s-wildfire"
                      type="url"
                      value={settingsForm.wildfire_url}
                      onChange={e => setSettingsForm(f => ({ ...f, wildfire_url: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={saveSettings} loading={savingSettings}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Broadcast + Export */}
              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                  <h2 className="mb-1 text-sm font-semibold text-ink">{t('facilitator.broadcast_label')}</h2>
                  <p className="mb-4 text-xs text-ink-muted">{t('facilitator.broadcast_hint')}</p>
                  <div className="flex gap-2">
                    <Input
                      value={broadcastMsg}
                      onChange={e => setBroadcastMsg(e.target.value)}
                      placeholder={t('facilitator.broadcast_placeholder')}
                      onKeyDown={e => { if (e.key === 'Enter') sendBroadcast() }}
                    />
                    <Button
                      variant="secondary"
                      onClick={sendBroadcast}
                      disabled={!broadcastMsg.trim()}
                      className="shrink-0"
                    >
                      {t('facilitator.broadcast_send')}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                  <h2 className="mb-1 text-sm font-semibold text-ink">{t('facilitator.export_csv')}</h2>
                  <p className="mb-4 text-xs text-ink-muted">{t('facilitator.export_csv_hint')}</p>
                  <Button
                    variant="secondary"
                    onClick={exportCSV}
                    disabled={participants.length === 0}
                  >
                    {t('facilitator.export_csv')}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <ReactionFeed events={reactions} />
    </div>
  )
}
