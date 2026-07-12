interface BroadcastBannerProps {
  message: string | null
  onDismiss: () => void
}

export function BroadcastBanner({ message, onDismiss }: BroadcastBannerProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start justify-between gap-4 border-b border-brand-200 bg-brand-50 px-6 py-4"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white"
          aria-hidden="true"
        >
          i
        </span>
        <p className="text-sm font-medium text-brand-900">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="shrink-0 text-brand-500 transition-colors hover:text-brand-700"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  )
}
