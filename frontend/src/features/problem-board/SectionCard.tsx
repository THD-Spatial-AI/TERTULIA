import { useState } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

export interface CanvasNote {
  id: string
  text: string
}

export interface CanvasSection {
  id: string
  chips: string[]
  notes: CanvasNote[]
}

interface Props {
  section: CanvasSection
  title: string
  hint: string
  onDropChip: (chip: string) => void
  onRemoveChip: (chip: string, index: number) => void
  onAddNote: () => void
  onUpdateNote: (noteId: string, text: string) => void
  onRemoveNote: (noteId: string) => void
}

export function SectionCard({
  section, title, hint,
  onDropChip, onRemoveChip, onAddNote, onUpdateNote, onRemoveNote,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const label = e.dataTransfer.getData('application/chip-label')
    if (label) onDropChip(label)
  }

  const hasContent = section.chips.length > 0 || section.notes.length > 0

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex h-full flex-col rounded-xl border-2 bg-white transition-all duration-150',
        isDragOver
          ? 'border-brand-400 shadow-md ring-2 ring-brand-400/15'
          : 'border-border',
      )}
    >
      {/* Header */}
      <div className="shrink-0 rounded-t-[10px] border-b border-border bg-surface-faint px-4 py-2.5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-ink-subtle">{hint}</p>
      </div>

      {/* Body — scrollable if content overflows */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">

        {/* Empty hint */}
        {!hasContent && (
          <div className={cn(
            'flex flex-1 items-center justify-center rounded-lg border border-dashed text-xs transition-colors',
            isDragOver
              ? 'border-brand-400 bg-brand-50 text-brand-600'
              : 'border-border text-ink-subtle',
          )}>
            {isDragOver ? 'Drop here' : 'Drag chips or add a note'}
          </div>
        )}

        {/* Chips */}
        {section.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {section.chips.map((chip, i) => (
              <span
                key={`${chip}-${i}`}
                className="group inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800"
              >
                {chip}
                <button
                  onClick={() => onRemoveChip(chip, i)}
                  className="ml-0.5 opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
                  title="Remove"
                >
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {section.notes.map(note => (
          <div key={note.id} className="group relative">
            <textarea
              value={note.text}
              onChange={e => onUpdateNote(note.id, e.target.value)}
              placeholder={t('problem_board.note_placeholder')}
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-surface-faint px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/15"
            />
            <button
              onClick={() => onRemoveNote(note.id)}
              className="absolute right-2 top-2 text-ink-subtle opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
              title="Remove note"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        ))}

        {/* Add note — sticks to bottom */}
        {hasContent && (
          <button
            onClick={onAddNote}
            className="mt-auto flex items-center gap-1.5 self-start text-[11px] text-ink-subtle transition-colors hover:text-brand-600"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            {t('problem_board.add_note')}
          </button>
        )}
      </div>
    </div>
  )
}
