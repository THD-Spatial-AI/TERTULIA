import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup'

export function FacilitatorLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) { toast.error(error.message); return }
        toast.success('Account created! You can now sign in.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) { toast.error(error.message); return }
        navigate('/facilitator', { replace: true })
      }
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const darkInput = 'flex h-10 w-full rounded-lg border border-brand-700 bg-brand-800/60 px-3.5 py-2 text-sm text-white placeholder:text-brand-600 transition-colors hover:border-brand-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

  return (
    <div className="flex min-h-screen flex-col bg-brand-950">
      <NavBar />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-brand-800 bg-brand-900/60 p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-white">
                {mode === 'login' ? t('facilitator.login_title') : 'Create account'}
              </h1>
              <p className="mt-1.5 text-sm text-brand-400">
                {mode === 'login'
                  ? 'Sign in to manage your workshop sessions.'
                  : 'Create a facilitator account to get started.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-brand-300">{t('facilitator.email_label')}</Label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('facilitator.email_placeholder')}
                  autoComplete="email"
                  required
                  className={darkInput}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-brand-300">Password</Label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                  className={darkInput}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-brand-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-brand-300 underline underline-offset-2 hover:text-white transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
