import { type ReactNode } from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LogOut } from 'lucide-react'
import { cn, getStoredParticipant } from '@/lib/utils'
import { t, useLang } from '@/lib/i18n'
import { signOut } from '@/lib/auth'
import { useDossier } from '@/lib/dossier'
import { Avatar } from '@/components/ui/Avatar'
import { DossierPile } from '@/components/ui/DossierStack'
import { BroadcastBanner } from '@/components/ui/BroadcastBanner'
import { WorkshopProgress } from '@/components/ui/WorkshopProgress'
import { LanguageMenu, menuContent, menuItem } from './LanguageMenu'
import { SkipLink, Wordmark } from './Wordmark'

function HeaderBar({ left, right, className }: { left: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <header className={cn('h-14 shrink-0 border-b border-line bg-paper', className)}>
      <SkipLink />
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">{left}</div>
        <div className="flex shrink-0 items-center gap-1.5">{right}</div>
      </div>
    </header>
  )
}

/** Wordmark + language only. Login, join and 404. */
export function MinimalHeader({ className }: { className?: string }) {
  useLang()
  return <HeaderBar className={className} left={<Wordmark />} right={<LanguageMenu />} />
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex h-14 items-center text-sm font-medium transition-colors',
    isActive
      ? 'text-ink after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-clay-600'
      : 'text-ink-muted hover:text-ink',
  )

interface FacilitatorHeaderProps {
  userEmail?: string
  /** Primary action for the page, e.g. "New session". */
  action?: ReactNode
}

export function FacilitatorHeader({ userEmail, action }: FacilitatorHeaderProps) {
  useLang()
  const { pathname } = useLocation()
  const onSettings = pathname.startsWith('/facilitator/settings')
  return (
    <HeaderBar
      left={
        <>
          <Wordmark to="/facilitator" />
          <nav aria-label={t('nav.main_label')} className="flex items-center gap-5">
            <NavLink to="/facilitator" className={() => navLink({ isActive: !onSettings })}>{t('nav.dashboard')}</NavLink>
            <NavLink to="/facilitator/settings" className={navLink}>{t('nav.settings')}</NavLink>
          </nav>
        </>
      }
      right={
        <>
          {action && <div className="mr-2 hidden sm:block">{action}</div>}
          <LanguageMenu />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger aria-label={t('nav.account')} className="ml-1 rounded-full">
              <Avatar name={userEmail ?? '?'} size="sm" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={6} className={menuContent}>
                {userEmail && (
                  <div className="px-2.5 pt-1.5 pb-2">
                    <p className="text-meta text-ink-subtle">{t('nav.signed_in_as')}</p>
                    <p className="truncate text-sm font-medium text-ink">{userEmail}</p>
                  </div>
                )}
                <DropdownMenu.Separator className="my-1 h-px bg-line" />
                <DropdownMenu.Item className={menuItem} onSelect={() => signOut()}>
                  <LogOut className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                  {t('nav.sign_out')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </>
      }
    />
  )
}

interface ParticipantHeaderProps {
  broadcastMessage?: string | null
  onDismissBroadcast?: () => void
  /** Hide the stepper (e.g. on the join form, before the participant is in). */
  showProgress?: boolean
}

/** Wordmark, who you are, your dossier, the workshop stepper and facilitator notes. */
export function ParticipantHeader({ broadcastMessage = null, onDismissBroadcast, showProgress = true }: ParticipantHeaderProps) {
  useLang()
  const { slug } = useParams<{ slug: string }>()
  const participant = getStoredParticipant()
  const dossier = useDossier(slug)

  return (
    <>
      <HeaderBar
        left={<Wordmark to={null} />}
        right={
          <>
            {participant && (
              <span className="mr-2 hidden items-center gap-2 sm:flex">
                <Avatar name={participant.display_name} size="sm" />
                <span className="max-w-40 truncate text-sm text-ink-muted">{participant.display_name}</span>
              </span>
            )}
            {showProgress && <DossierPile done={dossier} className="mr-2" />}
            <LanguageMenu />
          </>
        }
      />
      {showProgress && <WorkshopProgress />}
      {onDismissBroadcast && <BroadcastBanner message={broadcastMessage} onDismiss={onDismissBroadcast} />}
    </>
  )
}

