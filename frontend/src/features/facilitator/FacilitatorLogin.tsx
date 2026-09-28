import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MinimalHeader } from '@/components/layout/Headers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { t, useLang } from '@/lib/i18n'
import { getMe, login } from '@/lib/auth'

export function FacilitatorLogin() {
  useLang()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getMe().then((me) => {
      if (me?.authenticated) navigate('/facilitator', { replace: true })
    })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await login(email.trim(), password)
    setSubmitting(false)
    if (res.ok) {
      navigate('/facilitator', { replace: true })
    } else {
      setError(res.error ?? t('login.failed'))
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <MinimalHeader />
      <main id="main" className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-16 px-4 py-16 sm:px-6 md:grid-cols-[1fr_24rem]">
          <div className="hidden md:block" style={{ animation: 'rise-in 400ms var(--ease-soft) both' }}>
            <p className="font-display text-display text-ink">{t('login.heading')}</p>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-ink-muted">{t('login.aside')}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-line bg-paper-raised p-6 sm:p-8"
            style={{ animation: 'rise-in 400ms var(--ease-soft) 80ms both' }}
          >
            <h1 className="font-display text-title text-ink">{t('facilitator.login_title')}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">{t('login.subtitle')}</p>

            <div className="mt-7 space-y-5">
              <Field label={t('login.email')}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </Field>
              <Field label={t('login.password')} error={error ?? undefined}>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </Field>
            </div>

            <Button type="submit" className="mt-7 w-full" size="lg" loading={submitting}>
              {submitting ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
