import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MinimalHeader } from './Headers'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-none',
}

export function PageWrapper({ children, className, maxWidth = 'xl' }: PageWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <MinimalHeader />
      <main id="main" className={cn('flex-1', className)}>
        <div className={cn('mx-auto w-full px-4 py-8 sm:px-6', maxWidthClasses[maxWidth])}>{children}</div>
      </main>
    </div>
  )
}
