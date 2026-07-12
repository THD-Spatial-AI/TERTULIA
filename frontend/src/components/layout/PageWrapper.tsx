import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { NavBar } from './NavBar'

interface PageWrapperProps {
  children: ReactNode
  showNav?: boolean
  showSignOut?: boolean
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const maxWidthClasses = {
  sm:   'max-w-sm',
  md:   'max-w-2xl',
  lg:   'max-w-4xl',
  xl:   'max-w-6xl',
  '2xl':'max-w-screen-2xl',
  full: 'max-w-none',
}

export function PageWrapper({
  children,
  showNav = true,
  showSignOut = false,
  className,
  maxWidth = 'xl',
}: PageWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-faint">
      {showNav && <NavBar showSignOut={showSignOut} />}
      <main className={cn('flex-1 overflow-auto', className)}>
        <div className={cn('mx-auto w-full px-6 py-8', maxWidthClasses[maxWidth])}>
          {children}
        </div>
      </main>
    </div>
  )
}
