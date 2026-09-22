import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { t } from '@/lib/i18n'
import { getMe, loginUrl } from '@/lib/auth'

export function FacilitatorLogin() {
  const navigate = useNavigate()

  useEffect(() => {
    getMe().then((me) => {
      if (me?.authenticated) navigate('/facilitator', { replace: true })
    })
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col bg-brand-950">
      <NavBar />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-brand-800 bg-brand-900/60 p-8 text-center">
            <h1 className="text-xl font-semibold text-white">
              {t('facilitator.login_title')}
            </h1>
            <p className="mt-2 text-sm text-brand-400">
              Sign in with your Tertulia account to manage workshop sessions.
            </p>
            <a href={loginUrl()} className="mt-6 block">
              <Button className="w-full" size="lg">
                Sign in with Keycloak
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
