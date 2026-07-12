import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { t, getLanguage, setLanguage, type Language } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
  { code: 'gl', label: 'GL' },
]

interface NavBarProps {
  showSignOut?: boolean
  showFacilitatorNav?: boolean
  userEmail?: string
  right?: ReactNode
}

export function NavBar({ showSignOut = false, showFacilitatorNav = false, userEmail, right }: NavBarProps) {
  const [lang, setLang] = useState<Language>(getLanguage())
  const location = useLocation()

  function handleLanguage(code: Language) {
    setLanguage(code)
    setLang(code)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/facilitator/login'
  }

  const isSettingsActive = location.pathname === '/facilitator/settings'
  const isDashboardActive = location.pathname === '/facilitator' || location.pathname.startsWith('/facilitator/session') || location.pathname === '/facilitator/new'

  return (
    <header className="h-14 shrink-0 border-b border-border bg-surface shadow-xs">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-6">
        {/* Brand mark + facilitator nav */}
        <div className="flex items-center gap-6">
          <Link to="/facilitator" className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-brand-600">
              <svg
                className="h-4 w-4 text-white"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 2 L14 6 L14 10 L8 14 L2 10 L2 6 Z" />
                <path d="M8 2 L8 14 M2 6 L14 6 M2 10 L14 10" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">
              {t('nav.platform_title')}
            </span>
            <span className="hidden text-brand-600 sm:inline" aria-hidden="true">·</span>
            <span className="hidden text-xs text-ink-muted sm:inline">THD Spatial AI</span>
          </Link>

          {showFacilitatorNav && (
            <nav className="flex items-center gap-1" aria-label="Facilitator navigation">
              <Link
                to="/facilitator"
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isDashboardActive && !isSettingsActive
                    ? 'bg-surface-2 text-ink'
                    : 'text-ink-muted hover:bg-surface-1 hover:text-ink',
                )}
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                to="/facilitator/settings"
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isSettingsActive
                    ? 'bg-surface-2 text-ink'
                    : 'text-ink-muted hover:bg-surface-1 hover:text-ink',
                )}
              >
                {t('nav.settings')}
              </Link>
            </nav>
          )}
        </div>

        {/* Right slot */}
        <div className="flex items-center gap-2">
          {right}

          {/* Language switcher */}
          <div className="ml-1 flex items-center overflow-hidden rounded-md border border-border">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => handleLanguage(code)}
                aria-pressed={code === lang}
                aria-label={`Switch to ${label}`}
                className={cn(
                  'h-7 w-9 text-xs font-medium transition-colors duration-100',
                  code === lang
                    ? 'bg-brand-600 text-white'
                    : 'bg-transparent text-ink-muted hover:bg-surface-1 hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* User avatar */}
          {userEmail && (
            <div
              title={userEmail}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
            >
              {userEmail.charAt(0).toUpperCase()}
            </div>
          )}

          {showSignOut && (
            <button
              onClick={handleSignOut}
              className="ml-1 h-8 rounded-md px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-1 hover:text-ink"
            >
              {t('nav.sign_out')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
