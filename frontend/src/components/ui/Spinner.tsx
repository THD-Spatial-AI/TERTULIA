import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-meta text-ink-subtle', className)}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label ?? t('common.loading')}</span>
    </span>
  )
}
