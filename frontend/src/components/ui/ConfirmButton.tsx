import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ConfirmButtonProps {
  onConfirm: () => void
  children: ReactNode
  confirmLabel: ReactNode
  /** Accessible name when `children` is icon-only. */
  'aria-label'?: string
  className?: string
  timeoutMs?: number
}

/** Two-step inline confirm for destructive actions: first press arms, second press fires. */
export function ConfirmButton({ onConfirm, children, confirmLabel, className, timeoutMs = 3000, ...rest }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function handleClick() {
    if (!armed) {
      setArmed(true)
      timer.current = setTimeout(() => setArmed(false), timeoutMs)
      return
    }
    clearTimeout(timer.current)
    setArmed(false)
    onConfirm()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => setArmed(false)}
      aria-label={armed ? undefined : rest['aria-label']}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-meta font-medium',
        'transition-[background-color,color] duration-150',
        armed
          ? 'bg-danger text-white hover:bg-danger/90'
          : 'text-ink-subtle hover:bg-danger-bg hover:text-danger',
        className,
      )}
    >
      <span aria-live="polite">{armed ? confirmLabel : children}</span>
    </button>
  )
}
