import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import * as Tabs from '@radix-ui/react-tabs'
import { ExternalLink } from 'lucide-react'
import { FacilitatorHeader } from '@/components/layout/Headers'
import { buttonClasses } from '@/components/ui/Button'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel'
import { Spinner } from '@/components/ui/Spinner'
import { Status } from '@/components/ui/Status'
import { ReactionFeed } from '@/components/ui/ReactionFeed'
import { t, useLang } from '@/lib/i18n'
import { apiFetch } from '@/lib/api'
import { getMe } from '@/lib/auth'
import { toEmbedUrl } from '@/lib/slides'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { phaseLabel, phaseTone, useDateFormat } from './phase'
import { PHASE_COMPLETION_KEY, getNextPhase, getPrevPhase } from './panel/phases'
import { PhaseControl } from './panel/PhaseControl'
import { JoinCard, RosterPreview } from './panel/Sidebar'
import { ParticipantsTab } from './panel/ParticipantsTab'
import { SettingsTab, type SessionSettings } from './panel/SettingsTab'
import type { Session, Participant, ParticipantCompletion } from '@/types'

interface ReactionTick {
  id: number
  kind: string
  name: string
}

const TABS = ['overview', 'participants', 'settings'] as const
type PanelTab = (typeof TABS)[number]

export function FacilitatorPanel() {
  useLang()
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: PanelTab = (TABS as readonly string[]).includes(searchParams.get('tab') ?? '')
    ? (searchParams.get('tab') as PanelTab)
    : 'overview'
  const dateFmt = useDateFormat()

  const [session, setSession] = useState<Session | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [goingBack, setGoingBack] = useState(false)
  const [reactions, setReactions] = useState<ReactionTick[]>([])
  const [completions, setCompletions] = useState<ParticipantCompletion[]>([])
  const [loadingCompletions, setLoadingCompletions] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [phaseElapsed, setPhaseElapsed] = useState(0)
  const [userEmail, setUserEmail] = useState<string>()

  const reactionIdRef = useRef(0)
  const phaseStartRef = useRef<number>(Date.now())

  function setTab(tab: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (tab === 'overview') next.delete('tab')
      else next.set('tab', tab)
      return next
    }, { replace: true })
  }

  const fetchParticipants = useCallback(async (sid: string) => {
    try {
      setParticipants(await apiFetch<Participant[]>(`/api/v1/participants/${sid}`))
    } catch { /* silent: polled */ }
  }, [])

  const fetchCompletions = useCallback(async (sid: string) => {
    setLoadingCompletions(true)
    try {
      setCompletions(await apiFetch<ParticipantCompletion[]>(`/api/v1/sessions/${sid}/completions`))
    } catch { /* silent: polled */ }
    finally { setLoadingCompletions(false) }
  }, [])

  useEffect(() => {
    getMe().then((me) => { if (me?.email) setUserEmail(me.email) })
  }, [])

  const handleReaction = useCallback(({ kind, name }: { kind: string; name: string }) => {
    const id = ++reactionIdRef.current
    setReactions(prev => [...prev.slice(-19), { id, kind, name }])
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 5000)
  }, [])

  useWorkshopChannel(session?.slug, { passive: true, onReaction: handleReaction })

  useEffect(() => {
    if (!sessionId) return
    apiFetch<Session>(`/api/v1/sessions/id/${sessionId}`)
      .then(setSession)
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
    if (activeTab === 'participants' && session) fetchCompletions(session.id)
  }, [activeTab, session, fetchCompletions])

  useEffect(() => {
    if (!session) return
    if (!PHASE_COMPLETION_KEY[session.phase]) return
    fetchCompletions(session.id)
    const interval = setInterval(() => fetchCompletions(session.id), 30_000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast.success(t('facilitator.launch_success', { count: result.launched }))
        if (result.warning) toast.warning(t('facilitator.launch_warning', { message: result.warning }))
        setSession(s => s ? { ...s, phase: 'launched' } : s)
      } else {
        const updated = await apiFetch<Session>(`/api/v1/sessions/${session.id}/phase`, {
          method: 'PATCH',
          body: JSON.stringify({ phase: next }),
        })
        setSession(updated)
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setGoingBack(false)
    }
  }

  async function removeParticipant(participantId: string) {
    try {
      await apiFetch(`/api/v1/participants/${participantId}`, { method: 'DELETE' })
      setParticipants(prev => prev.filter(p => p.id !== participantId))
      setCompletions(prev => prev.filter(c => c.participant_id !== participantId))
      toast.success(t('facilitator.participant_removed'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    }
  }

  async function saveSettings(form: SessionSettings) {
    if (!session) return
    setSavingSettings(true)
    try {
      const updated = await apiFetch<Session>(`/api/v1/sessions/${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title.trim() || undefined,
          slides_url: form.slides_url.trim() || null,
          wildfire_url: form.wildfire_url.trim() || undefined,
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

  async function sendBroadcast(message: string): Promise<boolean> {
    if (!session) return false
    try {
      await apiFetch(`/api/v1/sessions/${session.id}/broadcast`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      })
      toast.success(t('facilitator.broadcast_sent'))
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
      return false
    }
  }

  function exportCSV() {
    if (!session) return
    const headers = [t('panel.csv_name'), t('panel.csv_role'), t('panel.csv_org'), t('panel.csv_joined')]
    const rows = participants.map(p => [p.display_name, p.role, p.org ?? '', new Date(p.joined_at).toISOString()])
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.workshop_tag}-participants.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <FacilitatorHeader userEmail={userEmail} />
        <main id="main" className="flex flex-1 flex-col items-center justify-center gap-4">
          {loading ? <Spinner /> : (
            <>
              <p className="text-ink-muted">{t('errors.session_not_found')}</p>
              <Link to="/facilitator" className={buttonClasses('secondary')}>{t('common.back')}</Link>
            </>
          )}
        </main>
      </div>
    )
  }

  const joinUrl = `${window.location.origin}/session/${session.slug}`
  const completionKey = PHASE_COMPLETION_KEY[session.phase]
  const progress = completionKey && completions.length > 0
    ? { done: completions.filter(c => c[completionKey] as boolean).length, total: completions.length }
    : null
  const participantCount = participants.length === 1
    ? t('participant_lobby.participants_count_one', { count: 1 })
    : t('participant_lobby.participants_count_other', { count: participants.length })

  const tabClass =
    'relative -mb-px border-b-2 border-transparent px-1 py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink ' +
    'data-[state=active]:border-clay-600 data-[state=active]:text-ink'

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FacilitatorHeader userEmail={userEmail} />

      <main id="main" className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <nav aria-label={t('panel.breadcrumb')} className="text-meta text-ink-subtle">
            <Link to="/facilitator" className="transition-colors hover:text-ink">{t('facilitator.dashboard_title')}</Link>
            <span aria-hidden="true"> / </span>
            <span className="text-ink-muted" aria-current="page">{session.title}</span>
          </nav>
          <h1 className="mt-2 font-display text-title break-words text-ink">{session.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
            <Status tone={phaseTone(session.phase)}>{phaseLabel(session.phase)}</Status>
            <span className="font-mono text-meta text-ink-subtle" translate="no">{session.workshop_tag}</span>
            <span className="text-meta text-ink-subtle tabular-nums">{participantCount}</span>
          </div>

          <Tabs.Root value={activeTab} onValueChange={setTab} className="mt-8">
            <Tabs.List aria-label={t('panel.tabs_label')} className="flex gap-6 border-b border-line">
              {TABS.map(tab => (
                <Tabs.Trigger key={tab} value={tab} className={tabClass}>
                  {t(`facilitator.tab_${tab}`)}
                  {tab === 'participants' && participants.length > 0 && (
                    <span className="ml-1.5 text-ink-subtle tabular-nums">{participants.length}</span>
                  )}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="overview" className="pt-6 focus-visible:outline-none">
              <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                <div className="min-w-0 space-y-6">
                  <PhaseControl
                    phase={session.phase}
                    hasSlides={!!session.slides_url}
                    elapsed={phaseElapsed}
                    progress={progress}
                    advancing={advancing}
                    goingBack={goingBack}
                    onAdvance={advancePhase}
                    onBack={goBackPhase}
                  />

                  {session.phase === 'slides' && session.slides_url ? (
                    <Panel className="overflow-hidden">
                      <PanelHeader
                        title={t('facilitator.live_slides')}
                        action={
                          <a href={session.slides_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-meta font-medium text-clay-700 hover:underline">
                            {t('facilitator.open_in_google_slides')}
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        }
                      />
                      <iframe
                        src={toEmbedUrl(session.slides_url)}
                        className="block aspect-video w-full"
                        allow="autoplay"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                        referrerPolicy="no-referrer"
                        title={t('panel.slides_title')}
                      />
                    </Panel>
                  ) : (
                    <Panel>
                      <PanelHeader title={t('facilitator.session_details')} />
                      <PanelBody>
                        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                          <Detail label={t('facilitator.workshop_tag_dt')}>
                            <span className="font-mono" translate="no">{session.workshop_tag}</span>
                          </Detail>
                          <Detail label={t('facilitator.created_label')}>{dateFmt.format(new Date(session.created_at))}</Detail>
                          {session.slides_url && (
                            <Detail label={t('facilitator.slides_label')}>
                              <ExtLink href={session.slides_url}>{t('facilitator.open_slides')}</ExtLink>
                            </Detail>
                          )}
                          <Detail label={t('facilitator.wildfire_url_label')}>
                            <ExtLink href={session.wildfire_url}>{session.wildfire_url}</ExtLink>
                          </Detail>
                        </dl>
                      </PanelBody>
                    </Panel>
                  )}
                </div>

                <aside className="space-y-6">
                  <JoinCard joinUrl={joinUrl} />
                  <RosterPreview participants={participants} onViewAll={() => setTab('participants')} />
                </aside>
              </div>
            </Tabs.Content>

            <Tabs.Content value="participants" className="pt-6 focus-visible:outline-none">
              <ParticipantsTab
                participants={participants}
                completions={completions}
                loading={loadingCompletions}
                countLabel={participantCount}
                onRefresh={() => fetchCompletions(session.id)}
                onRemove={removeParticipant}
                onExport={exportCSV}
              />
            </Tabs.Content>

            <Tabs.Content value="settings" className="pt-6 focus-visible:outline-none">
              <SettingsTab
                initial={{ title: session.title, slides_url: session.slides_url ?? '', wildfire_url: session.wildfire_url }}
                saving={savingSettings}
                onSave={saveSettings}
                onBroadcast={sendBroadcast}
                onExport={exportCSV}
                canExport={participants.length > 0}
              />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </main>

      <ReactionFeed events={reactions} />
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-meta text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  )
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block truncate text-clay-700 hover:underline">
      {children}
    </a>
  )
}
