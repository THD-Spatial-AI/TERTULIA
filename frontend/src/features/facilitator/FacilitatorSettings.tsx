import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { t, getLanguage, setLanguage, type Language } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const LANGS: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'gl', label: 'GL', name: 'Galego' },
]

const DEFAULT_WILDFIRE_KEY = 'workshop_default_wildfire_url'

export function FacilitatorSettings() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [userEmail, setUserEmail] = useState<string>()
  const [defaultWildfireUrl, setDefaultWildfireUrl] = useState(
    () => localStorage.getItem(DEFAULT_WILDFIRE_KEY) ?? 'https://wildfire.thd-spatial-ai.de',
  )
  const [selectedLang, setSelectedLang] = useState<Language>(getLanguage())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate('/facilitator/login', { replace: true }); return }
      setUserEmail(data.session.user.email)
      setChecking(false)
    })
  }, [navigate])

  function saveDefaults() {
    localStorage.setItem(DEFAULT_WILDFIRE_KEY, defaultWildfireUrl.trim())
    toast.success(t('settings.saved'))
  }

  function applyLanguage(code: Language) {
    setSelectedLang(code)
    setLanguage(code)
    window.location.reload()
  }

  if (checking) return null

  return (
    <div className="flex min-h-screen flex-col bg-surface-faint">
      <NavBar showSignOut showFacilitatorNav userEmail={userEmail} />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <h1 className="text-xl font-semibold text-ink">{t('settings.title')}</h1>
          </div>

          {/* Account */}
          <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-ink">{t('settings.account')}</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-ink-subtle">{t('settings.account_email')}</p>
                <p className="text-sm font-medium text-ink">{userEmail}</p>
              </div>
            </div>
          </section>

          {/* Platform defaults */}
          <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-ink">{t('settings.defaults')}</h2>
            <p className="mb-5 text-xs text-ink-muted">{t('settings.default_wildfire_url_hint')}</p>
            <div className="space-y-1.5">
              <Label htmlFor="default-wildfire">{t('settings.default_wildfire_url')}</Label>
              <div className="flex gap-2">
                <Input
                  id="default-wildfire"
                  type="url"
                  value={defaultWildfireUrl}
                  onChange={e => setDefaultWildfireUrl(e.target.value)}
                  placeholder="https://wildfire.thd-spatial-ai.de"
                />
                <Button onClick={saveDefaults} className="shrink-0">
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </section>

          {/* Language */}
          <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-ink">{t('settings.language')}</h2>
            <p className="mb-4 text-xs text-ink-muted">{t('settings.language_hint')}</p>
            <div className="flex flex-wrap gap-2">
              {LANGS.map(({ code, label, name }) => (
                <button
                  key={code}
                  onClick={() => applyLanguage(code)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                    selectedLang === code
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-border bg-surface-1 text-ink hover:border-brand-300 hover:bg-surface-2',
                  )}
                >
                  <span className="font-mono text-xs font-semibold">{label}</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
