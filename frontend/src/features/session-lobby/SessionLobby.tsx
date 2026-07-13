import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { NavBar } from '@/components/layout/NavBar'
import {
  AnimatedForm,
  Ripple,
  TechOrbitDisplay,
  type Field,
} from '@/components/ui/modern-animated-sign-in'
import { partnerOrbitIcons } from '@/components/ui/partner-orbit'
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

  async function handleJoin(e: FormEvent<HTMLFormElement>) {
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

  const fields: Field[] = [
    {
      label: t('session_lobby.name_label'),
      required: true,
      type: 'text',
      placeholder: t('session_lobby.name_placeholder'),
      autoComplete: 'given-name',
      requiredError: t('facilitator.required_field'),
      onChange: (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value),
    },
    {
      label: t('session_lobby.role_label'),
      required: true,
      type: 'text',
      placeholder: t('session_lobby.role_placeholder'),
      autoComplete: 'organization-title',
      requiredError: t('facilitator.required_field'),
      onChange: (e: ChangeEvent<HTMLInputElement>) => setRole(e.target.value),
    },
    {
      label: t('session_lobby.org_label'),
      type: 'text',
      placeholder: t('session_lobby.org_placeholder'),
      autoComplete: 'organization',
      onChange: (e: ChangeEvent<HTMLInputElement>) => setOrg(e.target.value),
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <NavBar />

      <section className="flex flex-1 max-lg:justify-center">
        {/* Left — orbiting workshop icons */}
        <span className="relative flex flex-col justify-center w-1/2 max-lg:hidden">
          <Ripple mainCircleSize={100} className="max-w-full" />
          <TechOrbitDisplay iconsArray={partnerOrbitIcons} text="Tertulia" />

          {/* Session tag */}
          <div className="absolute bottom-8 left-12">
            <p className="text-xs font-mono text-ink-subtle uppercase tracking-widest">session</p>
            <p className="mt-1 font-mono text-sm text-ink-muted truncate">{slug ?? '—'}</p>
          </div>
        </span>

        {/* Right — join form */}
        <span className="w-1/2 flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%] py-12">
          <AnimatedForm
            header={t('session_lobby.form_heading')}
            subHeader={t('session_lobby.form_subheading')}
            fields={fields}
            submitButton={t('session_lobby.join_button')}
            isLoading={loading}
            onSubmit={handleJoin}
          />

          <p className="mt-6 max-w-sm text-center text-xs text-ink-subtle">
            {t('session_lobby.privacy_note')}
          </p>
        </span>
      </section>
    </div>
  )
}
