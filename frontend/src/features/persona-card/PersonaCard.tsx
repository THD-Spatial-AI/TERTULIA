import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ParticipantHeader } from '@/components/layout/Headers'
import { AtSign, Camera, Check, FileText, Flame, Mail, Map as MapIcon, MessageCircle, Plus, Users, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { field } from '@/components/ui/fieldStyles'
import { CompletedScreen } from '@/components/ui/CompletedScreen'
import { cn } from '@/lib/utils'
import { t, useLang } from '@/lib/i18n'
import { participantFetch } from '@/lib/api'
import { getStoredParticipant } from '@/lib/utils'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PersonaData {
  // Profile fields
  age: string
  org_type: string
  education_level: string
  job_position: string
  wildfire_role: string
  main_work_place: string
  locality_type: string
  // Description
  description: string
  // Competencies 1–5
  digital_competence: number
  technical_competence: number
  legal_knowledge: number
  prevention_knowledge: number
  app_predisposition: number
  // Information sources 1–5
  info_online: number
  info_traditional: number
  info_broadcasting: number
  info_colleagues: number
  info_official: number
  info_workshops: number
  // Tools & devices
  tools: string[]
  devices_private: string[]
  devices_work: string[]
  // Bullet lists
  objectives: string[]
  obstacles: string[]
}

type NumericField =
  | 'digital_competence' | 'technical_competence' | 'legal_knowledge'
  | 'prevention_knowledge' | 'app_predisposition'
  | 'info_online' | 'info_traditional' | 'info_broadcasting'
  | 'info_colleagues' | 'info_official' | 'info_workshops'

const INITIAL: PersonaData = {
  age: '', org_type: '', education_level: '', job_position: '',
  wildfire_role: '', main_work_place: '', locality_type: '',
  description: '',
  digital_competence: 3, technical_competence: 3, legal_knowledge: 3,
  prevention_knowledge: 3, app_predisposition: 3,
  info_online: 3, info_traditional: 3, info_broadcasting: 3,
  info_colleagues: 3, info_official: 3, info_workshops: 3,
  tools: [], devices_private: [], devices_work: [],
  objectives: [''], obstacles: [''],
}

// ── Static data (labels are i18n keys, resolved at render so language switches apply) ──

const COMPETENCIES: { key: NumericField; labelKey: string }[] = [
  { key: 'digital_competence',   labelKey: 'persona_card.comp_digital' },
  { key: 'technical_competence', labelKey: 'persona_card.comp_technical' },
  { key: 'legal_knowledge',      labelKey: 'persona_card.comp_legal' },
  { key: 'prevention_knowledge', labelKey: 'persona_card.comp_prevention' },
  { key: 'app_predisposition',   labelKey: 'persona_card.comp_app' },
]

const INFO_SOURCES: { key: NumericField; labelKey: string }[] = [
  { key: 'info_online',       labelKey: 'persona_card.info_online' },
  { key: 'info_traditional',  labelKey: 'persona_card.info_traditional' },
  { key: 'info_broadcasting', labelKey: 'persona_card.info_broadcasting' },
  { key: 'info_colleagues',   labelKey: 'persona_card.info_colleagues' },
  { key: 'info_official',     labelKey: 'persona_card.info_official' },
  { key: 'info_workshops',    labelKey: 'persona_card.info_workshops' },
]

const TOOLS_LIST: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'qgis',         label: 'QGIS',           Icon: MapIcon },
  { id: 'twitter',      label: 'X / Twitter',    Icon: AtSign },
  { id: 'whatsapp',     label: 'WhatsApp',       Icon: MessageCircle },
  { id: 'instagram',    label: 'Instagram',      Icon: Camera },
  { id: 'acrobat',      label: 'Acrobat / PDF',  Icon: FileText },
  { id: 'teams',        label: 'Teams / Slack',  Icon: Users },
  { id: 'email',        label: 'Email',          Icon: Mail },
  { id: 'wildfire_gis', label: 'Wildfire / GIS', Icon: Flame },
]

const DEVICES_LIST = [
  { id: 'phone',   labelKey: 'persona_card.device_phone' },
  { id: 'tablet',  labelKey: 'persona_card.device_tablet' },
  { id: 'laptop',  labelKey: 'persona_card.device_laptop' },
  { id: 'desktop', labelKey: 'persona_card.device_desktop' },
]

const EDUCATION_OPTIONS = ['primary', 'secondary', 'university', 'postgraduate', 'other']
const LOCALITY_OPTIONS = ['rural', 'urban', 'suburban']

// ── Sub-components ──────────────────────────────────────────────────────────

/** One band of the index card: heading on the left, content on the right (stacked on mobile). */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-x-10 gap-y-4 border-t border-line px-5 py-7 sm:px-8 lg:grid-cols-[12rem_1fr]">
      <header>
        <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-meta text-ink-muted">{subtitle}</p>}
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function TextField({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      <input id={id} name={id} autoComplete="off" className={cn(field, 'h-10')} {...props} />
    </div>
  )
}

function SelectField({ id, label, value, onChange, options }: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      <select id={id} name={id} value={value} onChange={e => onChange(e.target.value)} className={cn(field, 'h-10 bg-paper-raised text-ink')}>
        <option value="">{t('persona_card.not_set')}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

/** 1–5 scale as a native radio group: arrow keys work, and each dot has an accessible name. */
function RatingScale({ name, label, value, onChange }: { name: string; label: string; value: number; onChange: (n: number) => void }) {
  return (
    <fieldset className="flex items-center justify-between gap-4 py-1.5">
      <legend className="float-left min-w-0 flex-1 text-sm text-ink">{label}</legend>
      <div className="relative flex shrink-0 items-center gap-0" style={{ width: 164 }}>
        <span className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-line-strong" aria-hidden="true" />
        <span
          className="absolute top-1/2 left-3 h-px -translate-y-1/2 origin-left bg-clay-600 transition-transform duration-200 ease-soft"
          style={{ width: 'calc(100% - 1.5rem)', transform: `scaleX(${(value - 1) / 4})` }}
          aria-hidden="true"
        />
        {[1, 2, 3, 4, 5].map(n => (
          <label key={n} className="relative flex h-8 flex-1 cursor-pointer items-center justify-center">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={t('persona_card.rating_value', { n })}
              className="peer sr-only"
            />
            <span
              className={cn(
                'h-3 w-3 rounded-full border-[1.5px] transition-[background-color,border-color,transform] duration-150',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-clay-600 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper-raised',
                n <= value ? 'border-clay-600 bg-clay-600' : 'border-line-strong bg-paper-raised hover:border-clay-400',
                n === value && 'scale-125',
              )}
              aria-hidden="true"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ScaleEnds() {
  return (
    <div className="mt-2 flex justify-end gap-[6.5rem] pr-1 text-meta text-ink-subtle" aria-hidden="true">
      <span>{t('persona_card.scale_low')}</span>
      <span>{t('persona_card.scale_high')}</span>
    </div>
  )
}

function BulletEditor({ idPrefix, items, onChange, placeholder, addLabel }: {
  idPrefix: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  addLabel: string
}) {
  return (
    <div className="space-y-2">
      {items.map((text, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-[18px] h-px w-3 shrink-0 bg-clay-600" aria-hidden="true" />
          <label htmlFor={`${idPrefix}-${i}`} className="sr-only">{t('persona_card.item_label', { n: i + 1 })}</label>
          <textarea
            id={`${idPrefix}-${i}`}
            value={text}
            rows={1}
            placeholder={placeholder}
            className={cn(field, 'min-h-9 flex-1 resize-none overflow-hidden')}
            onChange={e => {
              const next = [...items]; next[i] = e.target.value; onChange(next)
              const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`
            }}
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={t('persona_card.remove_item', { n: i + 1 })}
              className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-danger-bg hover:text-danger"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="inline-flex items-center gap-1.5 rounded-md py-1 text-sm text-ink-muted transition-colors hover:text-clay-700"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function PersonaCard() {
  useLang()
  const { slug } = useParams<{ slug: string }>()
  const participant = getStoredParticipant()
  const [data, setData] = useState<PersonaData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { broadcastMessage, dismissBroadcast, connected } = useWorkshopChannel(slug)

  function scheduleAutosave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(false), 2000)
  }

  function setField(key: keyof PersonaData, value: PersonaData[keyof PersonaData]) {
    setData(prev => ({ ...prev, [key]: value }))
    scheduleAutosave()
  }

  function setRating(key: NumericField, n: number) {
    setData(prev => ({ ...prev, [key]: n }))
    scheduleAutosave()
  }

  function toggleTool(id: string) {
    setData(prev => ({
      ...prev,
      tools: prev.tools.includes(id) ? prev.tools.filter(x => x !== id) : [...prev.tools, id],
    }))
    scheduleAutosave()
  }

  function toggleDevice(col: 'private' | 'work', id: string) {
    const key = col === 'private' ? 'devices_private' : 'devices_work'
    setData(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x: string) => x !== id) : [...prev[key], id],
    }))
    scheduleAutosave()
  }

  // Autosave timers fire from an older render, so read the latest data from a ref at send time,
  // and never drop a save that arrives while another is in flight: chain it instead.
  const dataRef = useRef(data)
  dataRef.current = data
  const inFlight = useRef<Promise<void>>(Promise.resolve())

  function save(markCompleted = false): Promise<void> {
    const run = async () => {
      setSaving(true)
      try {
        const current = dataRef.current
        const age = current.age ? parseInt(current.age, 10) : null
        await participantFetch('/api/v1/templates/persona', {
          method: 'PUT',
          body: JSON.stringify({ extended_data: { ...current, age }, completed: markCompleted }),
        })
        if (markCompleted) setCompleted(true)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('errors.generic'))
      } finally {
        setSaving(false)
      }
    }
    inFlight.current = inFlight.current.then(run)
    return inFlight.current
  }

  if (completed) {
    return (
      <CompletedScreen
        activity="persona"
        broadcastMessage={broadcastMessage}
        onDismissBroadcast={dismissBroadcast}
        connected={connected}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <ParticipantHeader broadcastMessage={broadcastMessage} onDismissBroadcast={dismissBroadcast} />

      <main id="main" className="flex-1 px-4 pt-10 pb-28 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-title text-ink">{t('persona_card.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{t('persona_card.description')}</p>

          {/* The card itself */}
          <article className="mt-8 overflow-hidden rounded-xl border border-line-strong bg-paper-raised">
            <header className="flex items-end justify-between gap-6 px-5 pt-7 pb-6 sm:px-8">
              <div className="min-w-0">
                <span className="mb-4 block h-0.5 w-10 rounded-full bg-clay-600" aria-hidden="true" />
                <p className="font-display text-display break-words text-ink">{participant?.display_name ?? t('persona_card.title')}</p>
                {participant && (
                  <p className="mt-2 text-[0.9375rem] text-ink-muted">
                    {participant.role}{participant.org ? ` · ${participant.org}` : ''}
                  </p>
                )}
              </div>
              {participant && <Avatar name={participant.display_name} size="lg" className="hidden sm:inline-flex" />}
            </header>

            <Section title={t('persona_card.section_profile')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="age" label={t('persona_card.age_label')} type="number" inputMode="numeric" min={16} max={99}
                  value={data.age} onChange={e => setField('age', e.target.value)} placeholder={t('persona_card.age_placeholder')} />
                <TextField id="org_type" label={t('persona_card.org_type_label')}
                  value={data.org_type} onChange={e => setField('org_type', e.target.value)} placeholder={t('persona_card.org_type_placeholder')} />
                <SelectField id="education_level" label={t('persona_card.education_label')}
                  value={data.education_level} onChange={v => setField('education_level', v)}
                  options={EDUCATION_OPTIONS.map(v => ({ value: v, label: t(`persona_card.education_${v}`) }))} />
                <TextField id="job_position" label={t('persona_card.job_position_label')}
                  value={data.job_position} onChange={e => setField('job_position', e.target.value)} placeholder={t('persona_card.job_position_placeholder')} />
                <TextField id="wildfire_role" label={t('persona_card.wildfire_role_label')}
                  value={data.wildfire_role} onChange={e => setField('wildfire_role', e.target.value)} placeholder={t('persona_card.wildfire_role_placeholder')} />
                <TextField id="main_work_place" label={t('persona_card.work_place_label')}
                  value={data.main_work_place} onChange={e => setField('main_work_place', e.target.value)} placeholder={t('persona_card.work_place_placeholder')} />
                <SelectField id="locality_type" label={t('persona_card.locality_label')}
                  value={data.locality_type} onChange={v => setField('locality_type', v)}
                  options={LOCALITY_OPTIONS.map(v => ({ value: v, label: t(`persona_card.locality_${v}`) }))} />
              </div>
            </Section>

            <Section title={t('persona_card.section_description')}>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-ink">{t('persona_card.description_label')}</label>
              <textarea
                id="description"
                rows={4}
                value={data.description}
                onChange={e => setField('description', e.target.value)}
                placeholder={t('persona_card.description_placeholder')}
                className={cn(field, 'resize-y py-3')}
              />
            </Section>

            <Section title={t('persona_card.section_competencies')}>
              {COMPETENCIES.map(({ key, labelKey }) => (
                <RatingScale key={key} name={key} label={t(labelKey)} value={data[key]} onChange={n => setRating(key, n)} />
              ))}
              <ScaleEnds />
            </Section>

            <Section title={t('persona_card.section_info_sources')}>
              {INFO_SOURCES.map(({ key, labelKey }) => (
                <RatingScale key={key} name={key} label={t(labelKey)} value={data[key]} onChange={n => setRating(key, n)} />
              ))}
              <ScaleEnds />
            </Section>

            <Section title={t('persona_card.section_tools')}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TOOLS_LIST.map(({ id, label, Icon }) => {
                  const active = data.tools.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleTool(id)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm transition-[border-color,background-color,color] duration-150',
                        active ? 'border-clay-600 bg-clay-50 text-clay-800' : 'border-line bg-paper text-ink-muted hover:border-line-strong hover:text-ink',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate" translate="no">{label}</span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            </Section>

            <Section title={t('persona_card.section_devices')}>
              <table className="w-full max-w-md text-sm">
                <thead>
                  <tr className="border-b border-line text-meta text-ink-muted">
                    <th scope="col" className="pb-2 text-left font-normal"><span className="sr-only">{t('persona_card.section_devices')}</span></th>
                    <th scope="col" className="w-24 pb-2 text-center font-medium">{t('persona_card.device_private')}</th>
                    <th scope="col" className="w-24 pb-2 text-center font-medium">{t('persona_card.device_work')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DEVICES_LIST.map(device => (
                    <tr key={device.id} className="border-b border-line last:border-b-0">
                      <th scope="row" className="py-2.5 text-left font-normal text-ink">{t(device.labelKey)}</th>
                      {(['private', 'work'] as const).map(col => {
                        const checked = (col === 'private' ? data.devices_private : data.devices_work).includes(device.id)
                        return (
                          <td key={col} className="py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDevice(col, device.id)}
                              aria-label={t('persona_card.device_cell', {
                                device: t(device.labelKey),
                                use: t(col === 'private' ? 'persona_card.device_private' : 'persona_card.device_work'),
                              })}
                              className="h-4 w-4 cursor-pointer accent-clay-600"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title={t('persona_card.section_objectives')} subtitle={t('persona_card.objectives_label')}>
              <BulletEditor
                idPrefix="objective"
                items={data.objectives}
                onChange={items => { setData(prev => ({ ...prev, objectives: items })); scheduleAutosave() }}
                placeholder={t('persona_card.objectives_placeholder')}
                addLabel={t('persona_card.objectives_add')}
              />
            </Section>

            <Section title={t('persona_card.section_obstacles')} subtitle={t('persona_card.obstacles_label')}>
              <BulletEditor
                idPrefix="obstacle"
                items={data.obstacles}
                onChange={items => { setData(prev => ({ ...prev, obstacles: items })); scheduleAutosave() }}
                placeholder={t('persona_card.obstacles_placeholder')}
                addLabel={t('persona_card.obstacles_add')}
              />
            </Section>
          </article>
        </div>
      </main>

      {/* Sticky action bar: the one thing to do, always in reach on a long form */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-4 px-4 py-3 sm:px-6">
          <span className={cn('text-meta text-ink-subtle', !saving && 'sr-only')} aria-live="polite">{saving ? t('common.autosaving') : ''}</span>
          <Button onClick={() => { if (saveTimer.current) clearTimeout(saveTimer.current); void save(true) }} loading={saving}>{t('persona_card.done_button')}</Button>
        </div>
      </div>
    </div>
  )
}
