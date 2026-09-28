// Shared look for every text control (inputs, textareas, inline canvas editors).
// Use `field` for form fields and `fieldCompact` inside canvases and palettes.

const fieldCore = [
  'w-full border border-line bg-paper-raised text-ink',
  'placeholder:text-ink-subtle',
  'transition-[border-color,box-shadow,background-color] duration-150',
  'hover:border-line-strong',
  'focus-visible:outline-none focus-visible:border-clay-600 focus-visible:ring-2 focus-visible:ring-clay-600/20',
  'disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-muted',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/20',
].join(' ')

export const field = `${fieldCore} rounded-md px-3.5 py-2 text-sm`

export const fieldCompact = `${fieldCore} rounded-md px-2.5 py-1.5 text-xs`
