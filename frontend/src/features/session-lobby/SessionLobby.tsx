import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MinimalHeader } from '@/components/layout/Headers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { t, useLang } from '@/lib/i18n'
import { storeSessionToken, storeParticipant } from '@/lib/utils'

const API = ''

const STEPS = ['session_lobby.feature_persona', 'session_lobby.feature_flow', 'session_lobby.feature_launch']

export function SessionLobby() {
  useLang()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [org, setOrg] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionTitle, setSessionTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`${API}/api/v1/sessions/${slug}`)
      .then(r => (r.ok ? r.json() : null))
      .then(s => { if (typeof s?.title === 'string') setSessionTitle(s.title) })
      .catch(() => {})
  }, [slug])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/participants/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_slug: slug,
          display_name: name.trim(),
          role: role.trim(),
          org: org.trim() || null,
        }),
      })
      if (!res.ok) {
        if (res.status === 404) { toast.error(t('session_lobby.session_not_found')); return }
        toast.error(t('session_lobby.join_error'))
        return
      }
      const participant = await res.json()
      storeSessionToken(participant.session_token)
      storeParticipant({ display_name: name.trim(), role: role.trim(), org: org.trim() || undefined })
      navigate(`/session/${slug}/lobby`)
    } catch {
      toast.error(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <MinimalHeader />

      <main id="main" className="flex-1">
        <div className="mx-auto grid max-w-6xl gap-x-20 gap-y-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          {/* Who's hosting and why */}
          <div className="lg:col-start-1 lg:row-start-1" style={{ animation: 'rise-in 400ms var(--ease-soft) both' }}>
            <p className="font-mono text-meta text-ink-subtle" translate="no">{slug}</p>
            <h1 className="mt-4 font-display text-display text-ink">
              {sessionTitle ?? t('session_lobby.hero_heading')}
            </h1>
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-ink-muted">
              {t('session_lobby.hero_body')}
            </p>
          </div>

          {/* What will happen */}
          <section className="order-3 lg:order-none lg:col-start-1 lg:row-start-2" aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-heading font-semibold text-ink">{t('session_lobby.steps_heading')}</h2>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {STEPS.map((key, i) => (
                <li key={key} className="flex items-baseline gap-5 py-4">
                  <span className="w-5 shrink-0 font-display text-2xl leading-none text-clay-600 tabular-nums" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="text-[0.9375rem] text-ink">{t(key)}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Join */}
          <section
            className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
            aria-labelledby="join-heading"
            style={{ animation: 'rise-in 400ms var(--ease-soft) 80ms both' }}
          >
            <div className="rounded-xl border border-line bg-paper-raised p-6 sm:p-8">
              <h2 id="join-heading" className="font-display text-title text-ink">{t('session_lobby.form_heading')}</h2>
              <p className="mt-1.5 text-sm text-ink-muted">{t('session_lobby.form_subheading')}</p>

              <form onSubmit={handleJoin} className="mt-7 space-y-5">
                <Field label={t('session_lobby.name_label')}>
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('session_lobby.name_placeholder')}
                    autoComplete="name"
                    required
                  />
                </Field>

                <Field label={t('session_lobby.role_label')}>
                  <Input
                    id="role"
                    name="role"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder={t('session_lobby.role_placeholder')}
                    autoComplete="organization-title"
                    required
                  />
                </Field>

                <Field label={t('session_lobby.org_label')} optional>
                  <Input
                    id="org"
                    name="organization"
                    value={org}
                    onChange={e => setOrg(e.target.value)}
                    placeholder={t('session_lobby.org_placeholder')}
                    autoComplete="organization"
                  />
                </Field>

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  {t('session_lobby.join_button')}
                </Button>
              </form>

              <p className="mt-5 text-meta text-ink-subtle">{t('session_lobby.privacy_note')}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
