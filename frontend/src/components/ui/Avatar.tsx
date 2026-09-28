import { cn } from '@/lib/utils'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'h-7 w-7 text-[0.6875rem]', md: 'h-9 w-9 text-meta', lg: 'h-12 w-12 text-sm' }

/** Initials on a neutral fill. The name is exposed to assistive tech via `title` + sr-only text. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper-sunk font-semibold text-ink-muted',
        sizes[size],
        className,
      )}
    >
      <span aria-hidden="true">{initials(name)}</span>
      <span className="sr-only">{name}</span>
    </span>
  )
}
