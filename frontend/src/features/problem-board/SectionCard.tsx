import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { fieldCompact } from '@/components/ui/fieldStyles'
import { CHIP_MIME } from '@/components/canvas/ChipPalette'

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
  /** Chip currently picked in the palette (tap-to-place); shows a "Place here" action. */
  placing: string | null
  onPlace: () => void
  onDropChip: (chip: string) => void
  onRemoveChip: (chip: string, index: number) => void
  onAddNote: () => void
  onUpdateNote: (noteId: string, text: string) => void
  onRemoveNote: (noteId: string) => void
}

export function SectionCard({
  section, title, hint, placing, onPlace,
  onDropChip, onRemoveChip, onAddNote, onUpdateNote, onRemoveNote,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false)
  const headingId = `section-${section.id}`

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const label = e.dataTransfer.getData(CHIP_MIME)
    if (label) onDropChip(label)
  }

  const hasContent = section.chips.length > 0 || section.notes.length > 0
  const receptive = isDragOver || placing !== null

  return (
    <section
      aria-labelledby={headingId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex h-full flex-col rounded-lg border bg-paper-raised transition-[border-color,background-color] duration-150',
        isDragOver ? 'border-clay-600 bg-clay-50' : receptive ? 'border-line-strong' : 'border-line',
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div className="min-w-0">
          <span className="mb-2 block h-0.5 w-6 rounded-full bg-clay-600" aria-hidden="true" />
          <h2 id={headingId} className="text-sm font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-meta text-ink-subtle">{hint}</p>
        </div>
        {placing && (
          <button
            type="button"
            onClick={onPlace}
            className="shrink-0 rounded-md bg-clay-600 px-2.5 py-1.5 text-meta font-medium text-white transition-colors hover:bg-clay-700"
            style={{ animation: 'rise-in 150ms var(--ease-soft)' }}
          >
            {t('canvas.place_here')}
          </button>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-3">
        {!hasContent && (
          <p className={cn(
            'flex flex-1 items-center justify-center rounded-md border border-dashed px-3 py-4 text-center text-meta transition-colors',
            isDragOver ? 'border-clay-600 text-clay-700' : 'border-line text-ink-subtle',
          )}>
            {isDragOver ? t('canvas.drop_here') : t('canvas.empty_section')}
          </p>
        )}

        {section.chips.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {section.chips.map((chip, i) => (
              <li
                key={`${chip}-${i}`}
                className="inline-flex items-center gap-0.5 rounded-md border border-line-strong bg-paper py-0.5 pr-0.5 pl-2.5 text-xs text-ink"
              >
                {chip}
                <button
                  type="button"
                  onClick={() => onRemoveChip(chip, i)}
                  aria-label={t('canvas.remove_chip', { chip })}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-subtle transition-colors hover:bg-danger-bg hover:text-danger"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {section.notes.map(note => (
          <div key={note.id} className="flex items-start gap-1">
            <label htmlFor={`note-${note.id}`} className="sr-only">{t('canvas.note')}</label>
            <textarea
              id={`note-${note.id}`}
              value={note.text}
              onChange={e => onUpdateNote(note.id, e.target.value)}
              placeholder={t('problem_board.note_placeholder')}
              rows={2}
              className={cn(fieldCompact, 'resize-none')}
            />
            <button
              type="button"
              onClick={() => onRemoveNote(note.id)}
              aria-label={t('canvas.remove_note')}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-subtle transition-colors hover:bg-danger-bg hover:text-danger"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAddNote}
          className="mt-auto inline-flex items-center gap-1.5 self-start rounded-md py-1 text-meta text-ink-muted transition-colors hover:text-clay-700"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t('problem_board.add_note')}
        </button>
      </div>
    </section>
  )
}
