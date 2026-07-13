import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup'

export function FacilitatorLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

  const fields: Field[] = [
    {
      label: t('facilitator.email_label'),
      required: true,
      type: 'email',
      placeholder: t('facilitator.email_placeholder'),
      autoComplete: 'email',
      requiredError: t('facilitator.required_field'),
      onChange: (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
    },
    {
      label: 'Password',
      required: true,
      type: 'password',
      placeholder: '••••••••',
      autoComplete: mode === 'login' ? 'current-password' : 'new-password',
      requiredError: t('facilitator.required_field'),
      onChange: (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
    },
    ...(mode === 'signup'
      ? [
          {
            label: 'Repeat password',
            required: true,
            type: 'password',
            placeholder: '••••••••',
            autoComplete: 'new-password',
            requiredError: t('facilitator.required_field'),
            matchWith: 'Password',
            matchError: 'Passwords do not match',
          } satisfies Field,
        ]
      : []),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <NavBar />

      <section className="flex flex-1 max-lg:justify-center">
        {/* Left — orbiting partner logos */}
        <span className="relative flex flex-col justify-center w-1/2 max-lg:hidden">
          <Ripple mainCircleSize={100} className="max-w-full" />
          <TechOrbitDisplay iconsArray={partnerOrbitIcons} text="Tertulia" />
        </span>

        {/* Right — login / signup form */}
        <span className="w-1/2 flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%] py-12">
          <AnimatedForm
            header={mode === 'login' ? t('facilitator.login_title') : 'Create account'}
            subHeader={
              mode === 'login'
                ? 'Sign in to manage your workshop sessions.'
                : 'Create a facilitator account to get started.'
            }
            fields={fields}
            submitButton={mode === 'login' ? 'Sign in' : 'Create account'}
            textVariantButton={
              mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'
            }
            goTo={() => setMode(mode === 'login' ? 'signup' : 'login')}
            isLoading={loading}
            onSubmit={handleSubmit}
          />
        </span>
      </section>
    </div>
  )
}
