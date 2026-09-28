import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FacilitatorHeader } from '@/components/layout/Headers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel'
import { t, getLanguage, setLanguage, useLang, type Language } from '@/lib/i18n'
import { getMe } from '@/lib/auth'
import { cn } from '@/lib/utils'

const LANGS: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'gl', name: 'Galego' },
]

const DEFAULT_WILDFIRE_KEY = 'workshop_default_wildfire_url'

export function FacilitatorSettings() {
  useLang()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [userEmail, setUserEmail] = useState<string>()
  const [defaultWildfireUrl, setDefaultWildfireUrl] = useState(
    () => localStorage.getItem(DEFAULT_WILDFIRE_KEY) ?? 'https://wildfire.thd-spatial-ai.de',
  )
  const [selectedLang, setSelectedLang] = useState<Language>(getLanguage())

  useEffect(() => {
    getMe().then((me) => {
      if (!me?.authenticated) { navigate('/facilitator/login', { replace: true }); return }
      setUserEmail(me.email)
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
  }

  if (checking) return null

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FacilitatorHeader userEmail={userEmail} />

      <main id="main" className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="font-display text-display text-ink">{t('settings.title')}</h1>

          <Panel>
            <PanelHeader title={t('settings.account')} />
            <PanelBody className="flex items-center gap-3">
              <Avatar name={userEmail ?? '?'} />
              <div className="min-w-0">
                <p className="text-meta text-ink-subtle">{t('settings.account_email')}</p>
                <p className="truncate text-sm font-medium text-ink">{userEmail}</p>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title={t('settings.defaults')} description={t('settings.default_wildfire_url_hint')} />
            <PanelBody>
              <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); saveDefaults() }}>
                <Field label={t('settings.default_wildfire_url')} className="flex-1">
                  <Input
                    id="default-wildfire"
                    name="default_wildfire_url"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    value={defaultWildfireUrl}
                    onChange={e => setDefaultWildfireUrl(e.target.value)}
                    placeholder="https://wildfire.thd-spatial-ai.de"
                  />
                </Field>
                <Button type="submit" className="shrink-0">{t('common.save')}</Button>
              </form>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title={t('settings.language')} description={t('settings.language_hint')} />
            <PanelBody className="flex flex-wrap gap-2">
              {LANGS.map(({ code, name }) => (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  onClick={() => applyLanguage(code)}
                  aria-pressed={selectedLang === code}
                  className={cn(
                    'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                    selectedLang === code
                      ? 'border-clay-600 bg-clay-50 text-clay-800'
                      : 'border-line bg-paper-raised text-ink hover:border-line-strong',
                  )}
                >
                  {name}
                </button>
              ))}
            </PanelBody>
          </Panel>
        </div>
      </main>
    </div>
  )
}
