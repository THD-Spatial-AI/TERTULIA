import { useState } from 'react'
import { t } from '@/lib/i18n'

// ── Category definitions ─────────────────────────────────────────────────────
// Thematic problem/opportunity types that apply across any domain project.
// Chips are matched by label; unrecognised chips fall into "Other".

interface Category {
  name: string
  chips: Set<string>
}

const CATEGORIES: Category[] = [
  {
    name: 'Technical',
    chips: new Set([
      // Wildfire template
      'Poor network coverage',
      'Data latency',
      'No offline mode',
      'Sensor unreliability',
      'Equipment incompatibility',
      'Weather data integration',
      'Satellite coverage gaps',
      'Battery drain in field',
      // Generic template
      'Data availability',
      'Alert systems',
      'Network coverage',
      'Sensor reliability',
      'Data quality',
      'Integration',
      'Security',
      'Scalability',
    ]),
  },
  {
    name: 'Organisational',
    chips: new Set([
      // Wildfire template
      'Multi-agency silos',
      'Alert fatigue',
      'Training gap',
      'Decision-making speed',
      'Volunteer coordination',
      'Cross-border incidents',
      // Generic template
      'User training',
      'Coordination gap',
      'User adoption',
      'Stakeholder alignment',
    ]),
  },
  {
    name: 'Resources',
    chips: new Set([
      // Wildfire template
      'Budget cuts',
      'Resource allocation',
      // Generic template
      'Budget limits',
      'Budget',
      'Timeline',
    ]),
  },
  {
    name: 'Legal & Policy',
    chips: new Set([
      // Wildfire template
      'Jurisdiction overlap',
      'Legal liability',
      'Data sharing protocols',
      // Generic template
      'Legal constraints',
    ]),
  },
  {
    name: 'Communication',
    chips: new Set([
      // Wildfire template
      'Language barriers',
      'Public communication',
      'Media pressure',
    ]),
  },
  {
    name: 'Operational',
    chips: new Set([
      // Wildfire template
      'Early detection gap',
      'Evacuation routing',
    ]),
  },
]

function groupChips(allChips: string[]): { name: string; chips: string[] }[] {
  const used = new Set<string>()
  const groups: { name: string; chips: string[] }[] = []

  for (const cat of CATEGORIES) {
    const matching = allChips.filter(c => cat.chips.has(c))
    if (matching.length > 0) {
      groups.push({ name: cat.name, chips: matching })
      matching.forEach(c => used.add(c))
    }
  }

  const rest = allChips.filter(c => !used.has(c))
  if (rest.length > 0) {
    groups.push({ name: 'Other', chips: rest })
  }

  return groups
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  chips: string[]
  onDragStart: (e: React.DragEvent, label: string) => void
}

export function CanvasChipPalette({ chips, onDragStart }: Props) {
  const [customChips, setCustomChips] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function addCustom() {
    const label = input.trim()
    if (!label || chips.includes(label) || customChips.includes(label)) return
    setCustomChips(prev => [...prev, label])
    setInput('')
  }

  function toggleCategory(name: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const allChips = [...chips, ...customChips]
  const groups = groupChips(allChips)

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface">

      {/* Chip groups */}
      <div className="flex-1 space-y-1 p-3">
        <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
          {t('problem_board.chips_label')}
        </p>

        {groups.length === 0 && (
          <p className="px-1 text-xs text-ink-subtle">{t('problem_board.chips_empty')}</p>
        )}

        {groups.map(group => {
          const isCollapsed = collapsed.has(group.name)
          return (
            <div key={group.name}>
              <button
                type="button"
                onClick={() => toggleCategory(group.name)}
                className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left transition-colors hover:bg-surface-faint"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                  {group.name}
                </span>
                <svg
                  className={`h-3 w-3 text-ink-subtle transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                >
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>

              {!isCollapsed && (
                <div className="mb-2 mt-1 grid grid-cols-2 gap-1">
                  {group.chips.map(label => (
                    <div
                      key={label}
                      draggable
                      onDragStart={e => onDragStart(e, label)}
                      title={label}
                      className="flex min-h-[36px] cursor-grab select-none items-center rounded-lg border border-brand-200 bg-brand-50 px-2 py-1.5 text-[11px] font-medium leading-tight text-brand-800 shadow-xs transition-colors hover:border-brand-400 hover:bg-brand-100 active:cursor-grabbing"
                    >
                      <span className="line-clamp-2">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add custom chip */}
      <div className="shrink-0 border-t border-border bg-surface p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
          {t('problem_board.custom_chip_label')}
        </p>
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder={t('problem_board.custom_chip_placeholder')}
            className="min-w-0 flex-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none"
          />
          <button
            onClick={addCustom}
            disabled={!input.trim()}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600 disabled:opacity-40"
          >
            +
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-subtle">
          {t('problem_board.canvas_hint')}
        </p>
      </div>
    </aside>
  )
}
