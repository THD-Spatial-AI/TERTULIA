import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { t } from '@/lib/i18n'
import { storeSessionToken, storeParticipant } from '@/lib/utils'

const API = ''

export function SessionLobby() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [org, setOrg] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="flex min-h-screen flex-col bg-brand-950">
      <NavBar />

      {/* Split-screen body */}
      <div className="flex flex-1 flex-col lg:flex-row">

        {/* Left — dark hero panel */}
        <div className="relative flex flex-col justify-between overflow-hidden px-8 py-12 lg:w-[44%] lg:px-12 lg:py-16">
          {/* Decorative grid lines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(oklch(1 0 0) 1px, transparent 1px),
                linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
            aria-hidden="true"
          />
          {/* Accent glow */}
          <div
            className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
            style={{ background: 'oklch(0.480 0.178 290 / 0.18)' }}
            aria-hidden="true"
          />

          {/* Workshop identity */}
          <div className="relative">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-700/60 bg-brand-900/60 px-3 py-1.5 text-xs font-medium text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-fire-500 animate-pulse" aria-hidden="true" />
              Live session
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl" style={{ textWrap: 'balance' }}>
              {t('session_lobby.hero_heading')}
            </h1>
            <p className="mt-4 text-base text-brand-400 leading-relaxed" style={{ textWrap: 'pretty' }}>
              {t('session_lobby.hero_body')}
            </p>

            {/* Feature pills */}
            <ul className="mt-8 space-y-3" aria-label="Session features">
              {[
                { icon: '◈', text: t('session_lobby.feature_persona') },
                { icon: '⟶', text: t('session_lobby.feature_flow') },
                { icon: '◉', text: t('session_lobby.feature_launch') },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-brand-300">
                  <span className="font-mono text-brand-500 w-4 text-center" aria-hidden="true">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom session tag */}
          <div className="relative mt-12">
            <p className="text-xs font-mono text-brand-600 uppercase tracking-widest">
              session
            </p>
            <p className="mt-1 font-mono text-sm text-brand-400 truncate">
              {slug ?? '—'}
            </p>
          </div>
        </div>

        {/* Right — join form */}
        <div className="flex flex-1 items-center justify-center bg-surface px-8 py-12 lg:px-16">
          <div className="w-full max-w-sm">
            <h2 className="text-xl font-semibold text-ink">
              {t('session_lobby.form_heading')}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {t('session_lobby.form_subheading')}
            </p>

            <form onSubmit={handleJoin} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t('session_lobby.name_label')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('session_lobby.name_placeholder')}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">{t('session_lobby.role_label')}</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder={t('session_lobby.role_placeholder')}
                  autoComplete="organization-title"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org">
                  {t('session_lobby.org_label')}
                  <span className="ml-1 text-xs text-ink-subtle font-normal">({t('common.optional')})</span>
                </Label>
                <Input
                  id="org"
                  value={org}
                  onChange={e => setOrg(e.target.value)}
                  placeholder={t('session_lobby.org_placeholder')}
                  autoComplete="organization"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {t('session_lobby.join_button')}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-ink-subtle">
              {t('session_lobby.privacy_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
