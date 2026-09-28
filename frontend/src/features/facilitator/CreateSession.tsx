import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { FacilitatorHeader } from '@/components/layout/Headers'
import { ChevronDown, RotateCcw, X } from 'lucide-react'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { t, useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { WILDFIRE_TEMPLATE } from './wildfire-template'
import type { Session } from '@/types'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// ── Chip list (reusable within this file) ────────────────────────────────────

interface ChipListProps {
  id: string
  label: string
  hint: string
  chips: string[]
  inputValue: string
  placeholder: string
  addLabel: string
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (chip: string) => void
  onReset: () => void
  children?: React.ReactNode
}

function ChipList({ id, label, hint, chips, inputValue, placeholder, addLabel, onInputChange, onAdd, onRemove, onReset, children }: ChipListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
          <p id={`${id}-hint`} className="mt-0.5 text-meta text-ink-subtle">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-meta font-medium text-ink-muted transition-colors hover:bg-paper-sunk hover:text-ink"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          {t('facilitator.reset_to_wildfire')}
        </button>
      </div>

      {children}

      <div className="flex gap-2">
        <Input
          id={id}
          name={id}
          autoComplete="off"
          aria-describedby={`${id}-hint`}
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={onAdd} disabled={!inputValue.trim()} className="shrink-0">
          {addLabel}
        </Button>
      </div>
      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map(chip => (
            <li key={chip} className="inline-flex items-center gap-0.5 rounded-md border border-line-strong bg-paper-raised py-0.5 pr-0.5 pl-2.5 text-sm text-ink">
              {chip}
              <button
                type="button"
                onClick={() => onRemove(chip)}
                aria-label={t('create.remove_chip', { chip })}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-subtle transition-colors hover:bg-danger-bg hover:text-danger"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────

function WildfireTemplateCard({ onLoad }: { onLoad: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const tpl = WILDFIRE_TEMPLATE

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-paper-raised">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <span className="mb-3 block h-0.5 w-8 rounded-full bg-clay-600" aria-hidden="true" />
          <h3 className="font-display text-2xl leading-tight text-ink">{tpl.title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{tpl.description}</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-meta text-ink-subtle tabular-nums">
            <span>{tpl.userFlowChips.length} {t('facilitator.template_preview_flow_steps')}</span>
            <span>{tpl.canvasChips.length} {t('facilitator.template_preview_canvas_chips')}</span>
            <span>{tpl.stakeholderSuggestions.length} {t('facilitator.template_preview_stakeholders')}</span>
            <span>{tpl.useCases.length} {t('facilitator.template_preview_use_cases')}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button onClick={onLoad}>{t('facilitator.template_wildfire_load')}</Button>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            aria-controls="template-details"
            className="inline-flex items-center gap-1 text-meta text-ink-muted transition-colors hover:text-ink"
          >
            {expanded ? t('facilitator.template_preview_hide') : t('facilitator.template_preview_show')}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', expanded && 'rotate-180')} aria-hidden="true" />
          </button>
        </div>
      </div>

      {expanded && (
        <div id="template-details" className="space-y-6 border-t border-line bg-paper px-5 py-5 sm:px-6">
          <div>
            <h4 className="mb-2 text-sm font-medium text-ink">{t('facilitator.template_preview_use_cases_label')}</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {tpl.useCases.map((uc, i) => (
                <div key={i} className="rounded-md border border-line bg-paper-raised p-3">
                  <p className="text-sm font-medium text-ink">{uc.title}</p>
                  <p className="mt-0.5 text-meta text-ink-muted">{uc.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-ink">
              {t('facilitator.template_preview_stakeholders_label')} <span className="font-normal text-ink-subtle">{tpl.stakeholderSuggestions.length}</span>
            </h4>
            <p className="text-meta leading-relaxed text-ink-muted">{tpl.stakeholderSuggestions.join(' · ')}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <PreviewList title={t('facilitator.template_preview_flow_chips_label')} items={tpl.userFlowChips} />
            <PreviewList title={t('facilitator.template_preview_canvas_chips_label')} items={tpl.canvasChips} />
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-ink">
        {title} <span className="font-normal text-ink-subtle">{items.length}</span>
      </h4>
      <ul className="space-y-1 text-meta text-ink-muted">
        {items.map(c => <li key={c}>{c}</li>)}
      </ul>
    </div>
  )
}

const ZONES = [
  { key: 'facilitator.zone_customer', range: [0, 4], tone: 'bg-paper-raised' },
  { key: 'facilitator.zone_internal', range: [4, 8], tone: 'bg-sage-100/40' },
  { key: 'facilitator.zone_external', range: [8, 15], tone: 'bg-sage-100/70' },
  { key: 'facilitator.zone_public', range: [15, 99], tone: 'bg-sage-100' },
] as const

// ── Main component ────────────────────────────────────────────────────────────

export function CreateSession() {
  useLang()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    workshop_tag: '',
    slides_url: '',
    wildfire_url: localStorage.getItem('workshop_default_wildfire_url') ?? 'https://wildfire.thd-spatial-ai.de',
  })
  const [tagTouched, setTagTouched] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  // Chip lists
  const [chips, setChips] = useState<string[]>([])
  const [chipInput, setChipInput] = useState('')
  const [canvasChips, setCanvasChips] = useState<string[]>([])
  const [canvasChipInput, setCanvasChipInput] = useState('')
  const [stakeholderSuggestions, setStakeholderSuggestions] = useState<string[]>([])
  const [stakeholderInput, setStakeholderInput] = useState('')

  function set(field: keyof typeof form, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !tagTouched) {
        next.workshop_tag = slugify(value)
      }
      return next
    })
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function validate() {
    const e: Partial<typeof form> = {}
    if (!form.title.trim()) e.title = t('facilitator.required_field')
    if (!form.workshop_tag.trim()) e.workshop_tag = t('facilitator.required_field')
    else if (!/^[a-z0-9-]+$/.test(form.workshop_tag))
      e.workshop_tag = t('facilitator.workshop_tag_hint')
    if (!form.wildfire_url.trim()) e.wildfire_url = t('facilitator.required_field')
    return e
  }

  function loadWildfireTemplate() {
    setTagTouched(true)
    setForm(prev => ({
      ...prev,
      title: WILDFIRE_TEMPLATE.title,
      workshop_tag: WILDFIRE_TEMPLATE.tag,
    }))
    setChips([...WILDFIRE_TEMPLATE.userFlowChips])
    setCanvasChips([...WILDFIRE_TEMPLATE.canvasChips])
    setStakeholderSuggestions([...WILDFIRE_TEMPLATE.stakeholderSuggestions])
    toast.success(t('facilitator.template_loaded'))
  }

  function addChip() {
    const label = chipInput.trim()
    if (!label || chips.includes(label)) return
    setChips(prev => [...prev, label])
    setChipInput('')
  }

  function addCanvasChip() {
    const label = canvasChipInput.trim()
    if (!label || canvasChips.includes(label)) return
    setCanvasChips(prev => [...prev, label])
    setCanvasChipInput('')
  }

  function addStakeholder() {
    const label = stakeholderInput.trim()
    if (!label || stakeholderSuggestions.includes(label)) return
    setStakeholderSuggestions(prev => [...prev, label])
    setStakeholderInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const session = await apiFetch<Session>('/api/v1/sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          workshop_tag: form.workshop_tag.trim(),
          slides_url: form.slides_url.trim() || null,
          wildfire_url: form.wildfire_url.trim(),
          user_flow_chips: chips,
          canvas_chips: canvasChips,
          stakeholder_suggestions: stakeholderSuggestions,
        }),
      })
      toast.success(t('facilitator.session_created'))
      navigate(`/facilitator/session/${session.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FacilitatorHeader />

      <main id="main" className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <nav aria-label={t('panel.breadcrumb')} className="text-meta text-ink-subtle">
            <Link to="/facilitator" className="transition-colors hover:text-ink">{t('facilitator.dashboard_title')}</Link>
            <span aria-hidden="true"> / </span>
            <span className="text-ink-muted" aria-current="page">{t('facilitator.create_session_title')}</span>
          </nav>

          <h1 className="mt-3 font-display text-display text-ink">{t('facilitator.create_session_title')}</h1>
          <p className="mt-2 max-w-xl text-[0.9375rem] text-ink-muted">{t('facilitator.create_session_subtitle')}</p>

          <section className="mt-10" aria-labelledby="template-heading">
            <h2 id="template-heading" className="mb-3 text-heading font-semibold text-ink">{t('facilitator.template_section_title')}</h2>
            <WildfireTemplateCard onLoad={loadWildfireTemplate} />
          </section>

          <div className="my-10 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="font-display text-lg text-ink-subtle italic">{t('facilitator.configure_manually')}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-10" noValidate>
            <section aria-labelledby="basics-heading" className="space-y-5">
              <h2 id="basics-heading" className="font-display text-title text-ink">{t('create.basics')}</h2>
              <Field label={t('facilitator.session_title_label')} error={errors.title}>
                <Input
                  id="title"
                  name="title"
                  autoComplete="off"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder={t('facilitator.session_title_placeholder')}
                  // First field of a dedicated create page: focusing it saves a click.
                  autoFocus
                />
              </Field>

              <Field label={t('facilitator.workshop_tag_label')} hint={t('facilitator.workshop_tag_hint')} error={errors.workshop_tag}>
                <Input
                  id="tag"
                  name="workshop_tag"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                  value={form.workshop_tag}
                  onChange={e => { setTagTouched(true); set('workshop_tag', e.target.value) }}
                  placeholder={t('facilitator.workshop_tag_placeholder')}
                />
              </Field>

              <Field label={t('facilitator.slides_url_label')}>
                <Input
                  id="slides"
                  name="slides_url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={form.slides_url}
                  onChange={e => set('slides_url', e.target.value)}
                  placeholder={t('facilitator.slides_url_placeholder')}
                />
              </Field>

              <Field label={t('facilitator.wildfire_url_label')} error={errors.wildfire_url}>
                <Input
                  id="wildfire"
                  name="wildfire_url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={form.wildfire_url}
                  onChange={e => set('wildfire_url', e.target.value)}
                  placeholder={t('facilitator.wildfire_url_placeholder')}
                />
              </Field>
            </section>

            <section aria-labelledby="content-heading" className="space-y-8 border-t border-line pt-10">
              <h2 id="content-heading" className="font-display text-title text-ink">{t('create.content')}</h2>

              <ChipList
                id="flow-chip"
                label={t('facilitator.user_flow_chips_label')}
                hint={t('facilitator.user_flow_chips_hint')}
                chips={chips}
                inputValue={chipInput}
                placeholder={t('facilitator.user_flow_chips_placeholder')}
                addLabel={t('facilitator.user_flow_chips_add')}
                onInputChange={setChipInput}
                onAdd={addChip}
                onRemove={label => setChips(prev => prev.filter(c => c !== label))}
                onReset={() => setChips([...WILDFIRE_TEMPLATE.userFlowChips])}
              />

              <ChipList
                id="canvas-chip"
                label={t('facilitator.canvas_chips_label')}
                hint={t('facilitator.canvas_chips_hint')}
                chips={canvasChips}
                inputValue={canvasChipInput}
                placeholder={t('facilitator.canvas_chips_placeholder')}
                addLabel={t('facilitator.canvas_chips_add')}
                onInputChange={setCanvasChipInput}
                onAdd={addCanvasChip}
                onRemove={label => setCanvasChips(prev => prev.filter(c => c !== label))}
                onReset={() => setCanvasChips([...WILDFIRE_TEMPLATE.canvasChips])}
              />

              <ChipList
                id="stakeholder"
                label={t('facilitator.stakeholder_suggestions_label')}
                hint={t('facilitator.stakeholder_suggestions_hint')}
                chips={stakeholderSuggestions}
                inputValue={stakeholderInput}
                placeholder={t('facilitator.stakeholder_suggestions_placeholder')}
                addLabel={t('facilitator.stakeholder_suggestions_add')}
                onInputChange={setStakeholderInput}
                onAdd={addStakeholder}
                onRemove={label => setStakeholderSuggestions(prev => prev.filter(s => s !== label))}
                onReset={() => setStakeholderSuggestions([...WILDFIRE_TEMPLATE.stakeholderSuggestions])}
              >
                {stakeholderSuggestions.length > 0 && (
                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
                    {ZONES.map(zone => (
                      <div key={zone.key} className={cn('p-3', zone.tone)}>
                        <p className="mb-1.5 font-display text-base text-sage-700 italic">{t(zone.key)}</p>
                        <ul className="space-y-0.5 text-meta text-ink-muted">
                          {stakeholderSuggestions.slice(zone.range[0], zone.range[1]).map(s => <li key={s}>{s}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </ChipList>
            </section>

            <div className="flex items-center justify-between border-t border-line pt-6">
              <Link to="/facilitator" className={buttonClasses('ghost')}>{t('common.back')}</Link>
              <Button type="submit" size="lg" loading={loading}>{t('facilitator.create_button')}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
