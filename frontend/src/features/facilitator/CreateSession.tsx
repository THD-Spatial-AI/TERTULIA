import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { t } from '@/lib/i18n'
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
  chips: string[]
  inputValue: string
  placeholder: string
  addLabel: string
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (chip: string) => void
}

function ChipList({ chips, inputValue, placeholder, addLabel, onInputChange, onAdd, onRemove }: ChipListProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={onAdd} disabled={!inputValue.trim()}>
          {addLabel}
        </Button>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map(chip => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pl-3 pr-2 text-sm font-medium text-brand-800"
            >
              {chip}
              <button
                type="button"
                onClick={() => onRemove(chip)}
                className="text-brand-400 transition-colors hover:text-error"
                aria-label={`Remove ${chip}`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────

function WildfireTemplateCard({ onLoad }: { onLoad: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const tpl = WILDFIRE_TEMPLATE

  return (
    <div className="overflow-hidden rounded-xl border border-brand-200 bg-brand-50/40">
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xl">
          🌲
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{tpl.title}</h3>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
              Wildfire
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">{tpl.description}</p>

          {/* Stats row */}
          <div className="mt-2 flex flex-wrap gap-3">
            <Stat n={tpl.userFlowChips.length} label={t('facilitator.template_preview_flow_steps')} />
            <Stat n={tpl.canvasChips.length} label={t('facilitator.template_preview_canvas_chips')} />
            <Stat n={tpl.stakeholderSuggestions.length} label={t('facilitator.template_preview_stakeholders')} />
            <Stat n={tpl.useCases.length} label={t('facilitator.template_preview_use_cases')} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button size="sm" onClick={onLoad}>
            {t('facilitator.template_wildfire_load')}
          </Button>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-ink-subtle hover:text-ink"
          >
            {expanded ? t('facilitator.template_preview_hide') : t('facilitator.template_preview_show')}
          </button>
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-brand-100 bg-white px-5 py-4 space-y-5">

          {/* Use cases */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              {t('facilitator.template_preview_use_cases_label')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {tpl.useCases.map((uc, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface-faint p-3">
                  <p className="text-xs font-semibold text-ink">{uc.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{uc.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stakeholders preview */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              {t('facilitator.template_preview_stakeholders_label')} ({tpl.stakeholderSuggestions.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tpl.stakeholderSuggestions.map(s => (
                <span key={s} className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs text-ink-muted">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Chips preview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                {t('facilitator.template_preview_flow_chips_label')} ({tpl.userFlowChips.length})
              </p>
              <ul className="space-y-0.5">
                {tpl.userFlowChips.map(c => (
                  <li key={c} className="text-[11px] text-ink-muted">· {c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                {t('facilitator.template_preview_canvas_chips_label')} ({tpl.canvasChips.length})
              </p>
              <ul className="space-y-0.5">
                {tpl.canvasChips.map(c => (
                  <li key={c} className="text-[11px] text-ink-muted">· {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="text-[11px] text-ink-subtle">
      <span className="font-semibold text-brand-700">{n}</span> {label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreateSession() {
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
    <div className="flex min-h-screen flex-col bg-surface-faint">
      <NavBar showSignOut showFacilitatorNav />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">

          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-ink-subtle">
            <Link to="/facilitator" className="transition-colors hover:text-ink">
              {t('facilitator.dashboard_title')}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{t('facilitator.create_session_title')}</span>
          </nav>

          <h1 className="text-xl font-semibold text-ink">{t('facilitator.create_session_title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('facilitator.create_session_subtitle')}</p>

          {/* ── Template section ──────────────────────────────────────────── */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              {t('facilitator.template_section_title')}
            </p>
            <WildfireTemplateCard onLoad={loadWildfireTemplate} />
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-faint px-3 text-xs text-ink-subtle">
                {t('facilitator.configure_manually')}
              </span>
            </div>
          </div>

          {/* ── Form ─────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">{t('facilitator.session_title_label')}</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder={t('facilitator.session_title_placeholder')}
                error={errors.title}
                autoFocus
              />
            </div>

            {/* Workshop tag */}
            <div className="space-y-1.5">
              <Label htmlFor="tag">{t('facilitator.workshop_tag_label')}</Label>
              <Input
                id="tag"
                value={form.workshop_tag}
                onChange={e => { setTagTouched(true); set('workshop_tag', e.target.value) }}
                placeholder={t('facilitator.workshop_tag_placeholder')}
                error={errors.workshop_tag}
              />
              <p className="text-xs text-ink-subtle">{t('facilitator.workshop_tag_hint')}</p>
            </div>

            <div className="border-t border-border" />

            {/* Slides URL */}
            <div className="space-y-1.5">
              <Label htmlFor="slides">
                {t('facilitator.slides_url_label')}
                <span className="ml-1.5 text-xs font-normal text-ink-subtle">({t('common.optional')})</span>
              </Label>
              <Input
                id="slides"
                type="url"
                value={form.slides_url}
                onChange={e => set('slides_url', e.target.value)}
                placeholder={t('facilitator.slides_url_placeholder')}
              />
            </div>

            {/* Wildfire URL */}
            <div className="space-y-1.5">
              <Label htmlFor="wildfire">{t('facilitator.wildfire_url_label')}</Label>
              <Input
                id="wildfire"
                type="url"
                value={form.wildfire_url}
                onChange={e => set('wildfire_url', e.target.value)}
                placeholder={t('facilitator.wildfire_url_placeholder')}
                error={errors.wildfire_url}
              />
            </div>

            <div className="border-t border-border" />

            {/* ── User Flow Chips ─────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>{t('facilitator.user_flow_chips_label')}</Label>
                  <p className="mt-0.5 text-xs text-ink-subtle">{t('facilitator.user_flow_chips_hint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setChips([...WILDFIRE_TEMPLATE.userFlowChips])}
                  className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600"
                >
                  {t('facilitator.reset_to_wildfire')}
                </button>
              </div>
              <ChipList
                chips={chips}
                inputValue={chipInput}
                placeholder={t('facilitator.user_flow_chips_placeholder')}
                addLabel={t('facilitator.user_flow_chips_add')}
                onInputChange={setChipInput}
                onAdd={addChip}
                onRemove={label => setChips(prev => prev.filter(c => c !== label))}
              />
            </div>

            {/* ── Canvas Chips ────────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>{t('facilitator.canvas_chips_label')}</Label>
                  <p className="mt-0.5 text-xs text-ink-subtle">{t('facilitator.canvas_chips_hint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCanvasChips([...WILDFIRE_TEMPLATE.canvasChips])}
                  className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600"
                >
                  {t('facilitator.reset_to_wildfire')}
                </button>
              </div>
              <ChipList
                chips={canvasChips}
                inputValue={canvasChipInput}
                placeholder={t('facilitator.canvas_chips_placeholder')}
                addLabel={t('facilitator.canvas_chips_add')}
                onInputChange={setCanvasChipInput}
                onAdd={addCanvasChip}
                onRemove={label => setCanvasChips(prev => prev.filter(c => c !== label))}
              />
            </div>

            {/* ── Stakeholder Suggestions ─────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>{t('facilitator.stakeholder_suggestions_label')}</Label>
                  <p className="mt-0.5 text-xs text-ink-subtle">{t('facilitator.stakeholder_suggestions_hint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStakeholderSuggestions([...WILDFIRE_TEMPLATE.stakeholderSuggestions])}
                  className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600"
                >
                  {t('facilitator.reset_to_wildfire')}
                </button>
              </div>

              {/* Zone preview badges */}
              {stakeholderSuggestions.length > 0 && (
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    {[
                      { label: t('facilitator.zone_customer'), color: 'text-brand-700 bg-brand-50 border-brand-200', range: [0, 4] },
                      { label: t('facilitator.zone_internal'), color: 'text-amber-700 bg-amber-50 border-amber-200', range: [4, 8] },
                      { label: t('facilitator.zone_external'), color: 'text-violet-700 bg-violet-50 border-violet-200', range: [8, 15] },
                      { label: t('facilitator.zone_public'),   color: 'text-slate-600 bg-slate-50 border-slate-200', range: [15, 99] },
                    ].map(zone => (
                      <div key={zone.label}>
                        <p className="mb-1 font-semibold text-ink-subtle">{zone.label}</p>
                        <ul className="space-y-0.5">
                          {stakeholderSuggestions.slice(zone.range[0], zone.range[1]).map(s => (
                            <li key={s} className={`rounded border px-1.5 py-0.5 ${zone.color}`}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ChipList
                chips={stakeholderSuggestions}
                inputValue={stakeholderInput}
                placeholder={t('facilitator.stakeholder_suggestions_placeholder')}
                addLabel={t('facilitator.stakeholder_suggestions_add')}
                onInputChange={setStakeholderInput}
                onAdd={addStakeholder}
                onRemove={label => setStakeholderSuggestions(prev => prev.filter(s => s !== label))}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <Link to="/facilitator">
                <Button variant="ghost" type="button">{t('common.back')}</Button>
              </Link>
              <Button type="submit" loading={loading}>
                {t('facilitator.create_button')}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
