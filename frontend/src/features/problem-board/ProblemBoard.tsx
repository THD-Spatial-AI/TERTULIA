import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CanvasLayout } from '@/components/canvas/CanvasLayout'
import { ChipPalette } from '@/components/canvas/ChipPalette'
import { CompletedScreen } from '@/components/ui/CompletedScreen'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { participantFetch } from '@/lib/api'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { SectionCard, type CanvasSection } from './SectionCard'
import { groupProblemChips } from './problemChips'
import type { Session } from '@/types'

const SECTION_IDS = ['context', 'goals', 'constraints', 'risks', 'quality', 'decisions'] as const

// Full-width sections span both grid columns on desktop
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
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  const { broadcastMessage, dismissBroadcast, connected } = useWorkshopChannel(slug)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/v1/sessions/${slug}`)
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
      toast.warning(t('canvas.empty_sections', { count: empty.length }), { duration: 4000 })
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

  function pickChip(label: string) {
    setSelectedChip(prev => (prev === label ? null : label))
  }

  function placeSelected(sectionId: string) {
    if (!selectedChip) return
    dropChip(sectionId, selectedChip)
    setSelectedChip(null)
  }

  if (completed) {
    return (
      <CompletedScreen
        activity="problem-board"
        broadcastMessage={broadcastMessage}
        onDismissBroadcast={dismissBroadcast}
        connected={connected}
      />
    )
  }

  return (
    <CanvasLayout
      title={t('problem_board.title')}
      description={t('problem_board.description')}
      submitLabel={t('problem_board.done_button')}
      onSubmit={submit}
      saving={saving}
      broadcastMessage={broadcastMessage}
      onDismissBroadcast={dismissBroadcast}
      palette={
        <ChipPalette
          chips={chips}
          group={groupProblemChips}
          onPick={pickChip}
          selected={selectedChip}
          hint={t('canvas.board_tap_hint')}
          emptyText={t('problem_board.chips_empty')}
          customPlaceholder={t('problem_board.custom_chip_placeholder')}
        />
      }
    >
      <div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-2">
          {sections.map(section => (
            <div key={section.id} className={cn(FULL_WIDTH.has(section.id) ? 'min-h-40 lg:col-span-2' : 'min-h-56')}>
              <SectionCard
                section={section}
                title={t(`problem_board.section_${section.id}`)}
                hint={t(`problem_board.section_${section.id}_hint`)}
                placing={selectedChip}
                onPlace={() => placeSelected(section.id)}
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
    </CanvasLayout>
  )
}
