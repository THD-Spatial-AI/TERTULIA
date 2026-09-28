import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { fieldCompact } from '@/components/ui/fieldStyles'

export interface ChipGroup {
  /** i18n key for the group name. */
  nameKey: string
  chips: string[]
}

export const CHIP_MIME = 'application/chip-label'

interface ChipPaletteProps {
  chips: string[]
  group: (chips: string[]) => ChipGroup[]
  /** Tap / Enter on a chip. */
  onPick: (label: string) => void
  selected?: string | null
  hint: string
  emptyText: string
  customPlaceholder: string
}

/** Categorised chips that can be dragged onto a canvas or tapped (touch + keyboard). */
export function ChipPalette({ chips, group, onPick, selected, hint, emptyText, customPlaceholder }: ChipPaletteProps) {
  const [customChips, setCustomChips] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function addCustom(e: React.FormEvent) {
    e.preventDefault()
    const label = input.trim()
    if (!label || chips.includes(label) || customChips.includes(label)) return
    setCustomChips(prev => [...prev, label])
    setInput('')
  }

  function toggle(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const groups = group([...chips, ...customChips])

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-4 p-4">
        <p className="text-meta text-ink-muted">{hint}</p>

        {groups.length === 0 && <p className="text-meta text-ink-subtle">{emptyText}</p>}

        {groups.map(g => {
          const isCollapsed = collapsed.has(g.nameKey)
          const listId = `chips-${g.nameKey.replace(/\W/g, '-')}`
          return (
            <section key={g.nameKey}>
              <button
                type="button"
                onClick={() => toggle(g.nameKey)}
                aria-expanded={!isCollapsed}
                aria-controls={listId}
                className="flex w-full items-center justify-between rounded-md py-1 text-left text-sm font-medium text-ink transition-colors hover:text-clay-700"
              >
                {t(g.nameKey)}
                <ChevronDown
                  className={cn('h-4 w-4 text-ink-subtle transition-transform duration-200', isCollapsed && '-rotate-90')}
                  aria-hidden="true"
                />
              </button>

              {!isCollapsed && (
                <ul id={listId} className="mt-2 flex flex-wrap gap-1.5 md:grid md:grid-cols-2">
                  {g.chips.map(label => (
                    <li key={label} className="min-w-0">
                      <button
                        type="button"
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData(CHIP_MIME, label)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onClick={() => onPick(label)}
                        aria-pressed={selected === undefined ? undefined : selected === label}
                        title={label}
                        className={cn(
                          'flex min-h-9 w-full cursor-grab items-center rounded-md border px-2.5 py-1.5 text-left text-xs leading-tight select-none active:cursor-grabbing',
                          'transition-[border-color,background-color,color] duration-150',
                          selected === label
                            ? 'border-clay-600 bg-clay-50 text-clay-800'
                            : 'border-line bg-paper-raised text-ink hover:border-line-strong',
                        )}
                      >
                        <span className="line-clamp-2">{label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <form onSubmit={addCustom} className="sticky bottom-0 flex gap-1.5 border-t border-line bg-paper-sunk p-4">
        <label htmlFor="custom-chip" className="sr-only">{t('canvas.add_chip')}</label>
        <input
          id="custom-chip"
          name="custom-chip"
          autoComplete="off"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={customPlaceholder}
          className={cn(fieldCompact, 'min-w-0 flex-1')}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label={t('canvas.add_chip')}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line-strong bg-paper-raised text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}

/** Build a grouping function from category → chip sets. Unmatched chips go to `fallbackKey`. */
export function categoriser(categories: { nameKey: string; chips: Set<string> }[], fallbackKey: string) {
  return (all: string[]): ChipGroup[] => {
    const used = new Set<string>()
    const groups: ChipGroup[] = []
    for (const cat of categories) {
      const matching = all.filter(c => cat.chips.has(c))
      if (matching.length) {
        groups.push({ nameKey: cat.nameKey, chips: matching })
        matching.forEach(c => used.add(c))
      }
    }
    const rest = all.filter(c => !used.has(c))
    if (rest.length) groups.push({ nameKey: fallbackKey, chips: rest })
    return groups
  }
}
