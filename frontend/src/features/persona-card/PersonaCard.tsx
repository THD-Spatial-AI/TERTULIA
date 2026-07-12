import { Fragment, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { BroadcastBanner } from '@/components/ui/BroadcastBanner'
import { WorkshopProgress } from '@/components/ui/WorkshopProgress'
import { CompletedScreen } from '@/components/ui/CompletedScreen'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
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

// ── Static data (evaluated once at module load) ─────────────────────────────

const COMPETENCIES: { key: NumericField; label: string }[] = [
  { key: 'digital_competence',   label: t('persona_card.comp_digital') },
  { key: 'technical_competence', label: t('persona_card.comp_technical') },
  { key: 'legal_knowledge',      label: t('persona_card.comp_legal') },
  { key: 'prevention_knowledge', label: t('persona_card.comp_prevention') },
  { key: 'app_predisposition',   label: t('persona_card.comp_app') },
]

const INFO_SOURCES: { key: NumericField; label: string }[] = [
  { key: 'info_online',       label: t('persona_card.info_online') },
  { key: 'info_traditional',  label: t('persona_card.info_traditional') },
  { key: 'info_broadcasting', label: t('persona_card.info_broadcasting') },
  { key: 'info_colleagues',   label: t('persona_card.info_colleagues') },
  { key: 'info_official',     label: t('persona_card.info_official') },
  { key: 'info_workshops',    label: t('persona_card.info_workshops') },
]

const TOOLS_LIST = [
  { id: 'qgis',         label: 'QGIS',           glyph: '🗺' },
  { id: 'twitter',      label: 'X / Twitter',     glyph: '✕' },
  { id: 'whatsapp',     label: 'WhatsApp',        glyph: '💬' },
  { id: 'instagram',    label: 'Instagram',       glyph: '📸' },
  { id: 'acrobat',      label: 'Acrobat / PDF',   glyph: '📋' },
  { id: 'teams',        label: 'Teams / Slack',   glyph: '👥' },
  { id: 'email',        label: 'Email',           glyph: '📧' },
  { id: 'wildfire_gis', label: 'Wildfire / GIS',  glyph: '🔥' },
]

const DEVICES_LIST = [
  { id: 'phone',   label: t('persona_card.device_phone') },
  { id: 'tablet',  label: t('persona_card.device_tablet') },
  { id: 'laptop',  label: t('persona_card.device_laptop') },
  { id: 'desktop', label: t('persona_card.device_desktop') },
]

const EDUCATION_OPTIONS = [
  { value: '',              label: '—' },
  { value: 'primary',      label: t('persona_card.education_primary') },
  { value: 'secondary',    label: t('persona_card.education_secondary') },
  { value: 'university',   label: t('persona_card.education_university') },
  { value: 'postgraduate', label: t('persona_card.education_postgraduate') },
  { value: 'other',        label: t('persona_card.education_other') },
]

const LOCALITY_OPTIONS = [
  { value: '',         label: '—' },
  { value: 'rural',    label: t('persona_card.locality_rural') },
  { value: 'urban',    label: t('persona_card.locality_urban') },
  { value: 'suburban', label: t('persona_card.locality_suburban') },
]

// ── Shared styles ───────────────────────────────────────────────────────────

const INPUT = 'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-border-strong focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15'
const FIELD_LABEL = 'block text-xs font-medium uppercase tracking-wide text-ink-subtle mb-1.5'

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <header className="mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </header>
      {children}
    </section>
  )
}

function RatingScale({ label, value, onChange }: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="min-w-0 flex-1 text-sm text-ink">{label}</span>
      <div className="relative shrink-0" style={{ width: 156 }}>
        {/* Track */}
        <div className="absolute top-1/2 left-[6px] right-[6px] h-px -translate-y-1/2 bg-border" />
        {/* Active fill */}
        <div
          className="absolute top-1/2 left-[6px] h-px -translate-y-1/2 bg-fire-500 transition-all duration-200"
          style={{ width: value > 1 ? `calc(${(value - 1) * 25}% - 2px)` : 0 }}
        />
        {/* Dots */}
        <div className="relative flex items-center justify-between">
          {([1, 2, 3, 4, 5] as const).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                'h-3 w-3 rounded-full border-2 transition-all duration-150',
                n <= value
                  ? 'border-fire-500 bg-fire-500 scale-125'
                  : 'border-border bg-white hover:border-fire-400 hover:scale-110',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function BulletEditor({ items, onChange, placeholder, addLabel }: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  addLabel: string
}) {
  return (
    <div className="space-y-2">
      {items.map((text, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-fire-500" aria-hidden="true" />
          <textarea
            value={text}
            rows={1}
            placeholder={placeholder}
            className="min-h-[36px] flex-1 resize-none overflow-hidden rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15"
            onChange={e => {
              const next = [...items]; next[i] = e.target.value; onChange(next)
              const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`
            }}
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="mt-2 shrink-0 text-ink-subtle transition-colors hover:text-error"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-brand-600"
      >
        <span className="text-base leading-none" aria-hidden="true">+</span>
        {addLabel}
      </button>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function PersonaCard() {
  const { slug } = useParams<{ slug: string }>()
  const participant = getStoredParticipant()
  const [data, setData] = useState<PersonaData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { broadcastMessage, dismissBroadcast } = useWorkshopChannel(slug)

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

  async function save(markCompleted = false) {
    if (saving) return
    setSaving(true)
    try {
      const age = data.age ? parseInt(data.age, 10) : null
      await participantFetch('/api/v1/templates/persona', {
        method: 'PUT',
        body: JSON.stringify({
          extended_data: { ...data, age },
          completed: markCompleted,
        }),
      })
      if (markCompleted) setCompleted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  if (completed) {
    return (
      <CompletedScreen
        message={t('persona_card.completed')}
        broadcastMessage={broadcastMessage}
        onDismissBroadcast={dismissBroadcast}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-faint">
      <NavBar />
      <BroadcastBanner message={broadcastMessage} onDismiss={dismissBroadcast} />
      <WorkshopProgress />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-5">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-ink">{t('persona_card.title')}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t('persona_card.description')}</p>
          </div>

          {/* Identity strip */}
          {participant && (
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 ring-2 ring-brand-200">
                {participant.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-ink">{participant.display_name}</p>
                <p className="text-sm text-ink-muted">
                  {participant.role}{participant.org ? ` · ${participant.org}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* ── 1. Profile ─────────────────────────────────────────────────── */}
          <Section title={t('persona_card.section_profile')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={FIELD_LABEL}>{t('persona_card.age_label')}</label>
                <input
                  type="number"
                  min={16} max={99}
                  value={data.age}
                  onChange={e => setField('age', e.target.value)}
                  placeholder={t('persona_card.age_placeholder')}
                  className={INPUT}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>{t('persona_card.org_type_label')}</label>
                <input
                  type="text"
                  value={data.org_type}
                  onChange={e => setField('org_type', e.target.value)}
                  placeholder={t('persona_card.org_type_placeholder')}
                  className={INPUT}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>{t('persona_card.education_label')}</label>
                <select
                  value={data.education_level}
                  onChange={e => setField('education_level', e.target.value)}
                  className={INPUT}
                >
                  {EDUCATION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={FIELD_LABEL}>{t('persona_card.job_position_label')}</label>
                <input
                  type="text"
                  value={data.job_position}
                  onChange={e => setField('job_position', e.target.value)}
                  placeholder={t('persona_card.job_position_placeholder')}
                  className={INPUT}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>{t('persona_card.wildfire_role_label')}</label>
                <input
                  type="text"
                  value={data.wildfire_role}
                  onChange={e => setField('wildfire_role', e.target.value)}
                  placeholder={t('persona_card.wildfire_role_placeholder')}
                  className={INPUT}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>{t('persona_card.work_place_label')}</label>
                <input
                  type="text"
                  value={data.main_work_place}
                  onChange={e => setField('main_work_place', e.target.value)}
                  placeholder={t('persona_card.work_place_placeholder')}
                  className={INPUT}
                />
              </div>

              <div className="sm:col-span-2 sm:max-w-xs">
                <label className={FIELD_LABEL}>{t('persona_card.locality_label')}</label>
                <select
                  value={data.locality_type}
                  onChange={e => setField('locality_type', e.target.value)}
                  className={INPUT}
                >
                  {LOCALITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          {/* ── 2. Description ─────────────────────────────────────────────── */}
          <Section
            title={t('persona_card.section_description')}
            subtitle={t('persona_card.description_label')}
          >
            <textarea
              rows={4}
              value={data.description}
              onChange={e => setField('description', e.target.value)}
              placeholder={t('persona_card.description_placeholder')}
              className="w-full resize-none rounded-lg border border-border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-border-strong focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15"
            />
          </Section>

          {/* ── 3 + 4. Competencies & Info sources (side by side on lg) ─────── */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title={t('persona_card.section_competencies')}>
              <div className="space-y-0.5">
                {COMPETENCIES.map(({ key, label }) => (
                  <RatingScale
                    key={key}
                    label={label}
                    value={data[key]}
                    onChange={n => setRating(key, n)}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-ink-subtle">
                <span>{t('persona_card.scale_low')}</span>
                <span>{t('persona_card.scale_high')}</span>
              </div>
            </Section>

            <Section title={t('persona_card.section_info_sources')}>
              <div className="space-y-0.5">
                {INFO_SOURCES.map(({ key, label }) => (
                  <RatingScale
                    key={key}
                    label={label}
                    value={data[key]}
                    onChange={n => setRating(key, n)}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-ink-subtle">
                <span>{t('persona_card.scale_low')}</span>
                <span>{t('persona_card.scale_high')}</span>
              </div>
            </Section>
          </div>

          {/* ── 5. Tools ──────────────────────────────────────────────────── */}
          <Section title={t('persona_card.section_tools')}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {TOOLS_LIST.map(tool => {
                const active = data.tools.includes(tool.id)
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all duration-150',
                      active
                        ? 'border-fire-400 bg-fire-50 text-fire-600 shadow-sm'
                        : 'border-border bg-surface-1 text-ink-muted hover:border-brand-300 hover:text-ink',
                    )}
                  >
                    <span className="text-2xl leading-none" aria-hidden="true">{tool.glyph}</span>
                    <span className="text-xs font-medium leading-snug">{tool.label}</span>
                    <span className={cn(
                      'h-1.5 w-1.5 rounded-full transition-colors',
                      active ? 'bg-fire-500' : 'bg-border',
                    )} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </Section>

          {/* ── 6. Devices ────────────────────────────────────────────────── */}
          <Section title={t('persona_card.section_devices')}>
            <div className="grid grid-cols-[1fr_80px_80px] items-center gap-x-4 gap-y-0">
              {/* Column headers */}
              <div />
              <p className="pb-3 text-center text-xs font-medium uppercase tracking-wide text-ink-muted">
                {t('persona_card.device_private')}
              </p>
              <p className="pb-3 text-center text-xs font-medium uppercase tracking-wide text-ink-muted">
                {t('persona_card.device_work')}
              </p>

              {/* Separator */}
              <div className="col-span-3 mb-2 h-px bg-border" />

              {DEVICES_LIST.map(device => (
                <Fragment key={device.id}>
                  <span className="py-3 text-sm text-ink">{device.label}</span>
                  {(['private', 'work'] as const).map(col => {
                    const active = col === 'private'
                      ? data.devices_private.includes(device.id)
                      : data.devices_work.includes(device.id)
                    return (
                      <div key={col} className="flex items-center justify-center py-3">
                        <button
                          type="button"
                          onClick={() => toggleDevice(col, device.id)}
                          aria-pressed={active}
                          className={cn(
                            'h-5 w-5 rounded-full border-2 transition-all duration-150',
                            active
                              ? 'border-fire-500 bg-fire-500 shadow-[0_0_8px_0] shadow-fire-500/40'
                              : 'border-border bg-white hover:border-fire-400',
                          )}
                        />
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </Section>

          {/* ── 7 + 8. Objectives & Obstacles (side by side on lg) ─────────── */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section
              title={t('persona_card.section_objectives')}
              subtitle={t('persona_card.objectives_label')}
            >
              <BulletEditor
                items={data.objectives}
                onChange={items => { setData(prev => ({ ...prev, objectives: items })); scheduleAutosave() }}
                placeholder={t('persona_card.objectives_placeholder')}
                addLabel={t('persona_card.objectives_add')}
              />
            </Section>

            <Section
              title={t('persona_card.section_obstacles')}
              subtitle={t('persona_card.obstacles_label')}
            >
              <BulletEditor
                items={data.obstacles}
                onChange={items => { setData(prev => ({ ...prev, obstacles: items })); scheduleAutosave() }}
                placeholder={t('persona_card.obstacles_placeholder')}
                addLabel={t('persona_card.obstacles_add')}
              />
            </Section>
          </div>

          {/* ── Submit ────────────────────────────────────────────────────── */}
          <div className="pb-8 pt-2">
            <Button className="w-full" size="lg" onClick={() => save(true)} loading={saving}>
              {t('persona_card.done_button')}
            </Button>
            {saving && (
              <p className="mt-2 text-center text-xs text-ink-subtle">{t('common.autosaving')}</p>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
