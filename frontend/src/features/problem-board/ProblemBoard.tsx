import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { BroadcastBanner } from '@/components/ui/BroadcastBanner'
import { WorkshopProgress } from '@/components/ui/WorkshopProgress'
import { CompletedScreen } from '@/components/ui/CompletedScreen'
import { t } from '@/lib/i18n'
import { participantFetch } from '@/lib/api'
import { BACKEND_URL } from '@/lib/config'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { SectionCard, type CanvasSection } from './SectionCard'
import { CanvasChipPalette } from './CanvasChipPalette'
import type { Session } from '@/types'

const SECTION_IDS = ['context', 'goals', 'constraints', 'risks', 'quality', 'decisions'] as const

// Full-width sections span both grid columns
const FULL_WIDTH = new Set(['context', 'decisions'])

const DEFAULT_SECTIONS: CanvasSection[] = SECTION_IDS.map(id => ({
  id,
  chips: [],
  notes: [],
}))

export function ProblemBoard() {
  const { slug } = useParams<{ slug: string }>()
  const [sections, setSections] = useState<CanvasSection[]>(DEFAULT_SECTIONS)
  const [chips, setChips] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  const { broadcastMessage, dismissBroadcast } = useWorkshopChannel(slug)

  useEffect(() => {
    if (!slug) return
    fetch(`${BACKEND_URL}/api/v1/sessions/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then((s: Session | null) => { if (s) setChips(s.canvas_chips ?? []) })
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    const hasContent = sections.some(s => s.chips.length > 0 || s.notes.length > 0)
    if (!hasContent) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaving(true)
      participantFetch('/api/v1/templates/problem-board', {
        method: 'PUT',
        body: JSON.stringify({ sections, completed: false }),
      })
        .catch(() => {})
        .finally(() => setSaving(false))
    }, 2000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections])

  async function submit() {
    const empty = sections.filter(s => s.chips.length === 0 && s.notes.length === 0)
    if (empty.length > 0) {
      toast.warning(
        `${empty.length} section${empty.length > 1 ? 's are' : ' is'} still empty — you can still complete.`,
        { duration: 4000 },
      )
    }
    setSaving(true)
    try {
      await participantFetch('/api/v1/templates/problem-board', {
        method: 'PUT',
        body: JSON.stringify({ sections, completed: true }),
      })
      setCompleted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  function dropChip(sectionId: string, chip: string) {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId || s.chips.includes(chip)) return s
      return { ...s, chips: [...s.chips, chip] }
    }))
  }

  function removeChip(sectionId: string, _chip: string, index: number) {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      const next = [...s.chips]
      next.splice(index, 1)
      return { ...s, chips: next }
    }))
  }

  function addNote(sectionId: string) {
    setSections(prev => prev.map(s =>
      s.id !== sectionId ? s : {
        ...s,
        notes: [...s.notes, { id: crypto.randomUUID(), text: '' }],
      },
    ))
  }

  function updateNote(sectionId: string, noteId: string, text: string) {
    setSections(prev => prev.map(s =>
      s.id !== sectionId ? s : {
        ...s,
        notes: s.notes.map(n => n.id === noteId ? { ...n, text } : n),
      },
    ))
  }

  function removeNote(sectionId: string, noteId: string) {
    setSections(prev => prev.map(s =>
      s.id !== sectionId ? s : { ...s, notes: s.notes.filter(n => n.id !== noteId) },
    ))
  }

  function onDragStart(e: React.DragEvent, label: string) {
    e.dataTransfer.setData('application/chip-label', label)
    e.dataTransfer.effectAllowed = 'move'
  }

  if (completed) {
    return (
      <CompletedScreen
        message={t('problem_board.completed')}
        broadcastMessage={broadcastMessage}
        onDismissBroadcast={dismissBroadcast}
      />
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-faint">
      <NavBar />
      <BroadcastBanner message={broadcastMessage} onDismiss={dismissBroadcast} />
      <WorkshopProgress />

      <div className="flex min-h-0 flex-1">
        <CanvasChipPalette chips={chips} onDragStart={onDragStart} />

        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="shrink-0 border-b border-border px-6 py-4">
            <h1 className="text-xl font-bold text-ink">{t('problem_board.title')}</h1>
            <p className="mt-0.5 text-sm text-ink-muted">{t('problem_board.description')}</p>
          </div>

          {/* Canvas — fills all remaining space, no scroll */}
          <div className="min-h-0 flex-1 p-4">
            <div className="grid h-full grid-cols-2 grid-rows-[1fr_2fr_2fr_1fr] gap-3">
              {sections.map(section => (
                <div
                  key={section.id}
                  className={FULL_WIDTH.has(section.id) ? 'col-span-2' : 'col-span-1'}
                >
                  <SectionCard
                    section={section}
                    title={t(`problem_board.section_${section.id}`)}
                    hint={t(`problem_board.section_${section.id}_hint`)}
                    onDropChip={chip => dropChip(section.id, chip)}
                    onRemoveChip={(chip, i) => removeChip(section.id, chip, i)}
                    onAddNote={() => addNote(section.id)}
                    onUpdateNote={(noteId, text) => updateNote(section.id, noteId, text)}
                    onRemoveNote={noteId => removeNote(section.id, noteId)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-ink-subtle">
              {saving ? t('common.autosaving') : ''}
            </span>
            <Button size="lg" onClick={submit} loading={saving}>
              {t('problem_board.done_button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
