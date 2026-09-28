import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

interface FieldProps {
  label: ReactNode
  /** The single form control. Field wires id, aria-describedby and aria-invalid onto it. */
  children: ReactElement<Record<string, unknown>>
  hint?: ReactNode
  error?: string
  optional?: boolean
  id?: string
  className?: string
}

export function Field({ label, children, hint, error, optional, id, className }: FieldProps) {
  const autoId = useId()
  const controlId = id ?? (children.props.id as string | undefined) ?? autoId
  const hintId = hint && !error ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={controlId} className="flex items-baseline gap-2 text-sm font-medium text-ink">
        {label}
        {optional && <span className="text-meta font-normal text-ink-subtle">{t('common.optional')}</span>}
      </label>
      {control}
      {hintId && (
        <p id={hintId} className="text-meta text-ink-subtle">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="text-meta font-medium text-danger">{error}</p>
      )}
    </div>
  )
}
