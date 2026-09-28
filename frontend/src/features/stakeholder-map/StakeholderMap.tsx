import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronDown, X } from 'lucide-react'
import { CanvasLayout } from '@/components/canvas/CanvasLayout'
import { fieldCompact } from '@/components/ui/fieldStyles'
import { CompletedScreen } from '@/components/ui/CompletedScreen'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { participantFetch } from '@/lib/api'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { RingBackground } from './RingBackground'
import { StakeholderNode } from './StakeholderNode'
import { RelationshipEdge } from './RelationshipEdge'

const nodeTypes = { stakeholderNode: StakeholderNode }
const edgeTypes = { relationshipEdge: RelationshipEdge }

// ── Stakeholder zone categorisation ──────────────────────────────────────────
// Maps known stakeholder names to one of the four ring zones.
// Names not in this map fall into an "Other" group at the bottom.

const ZONE_MAP = new Map<string, 'customer' | 'internal' | 'external' | 'public'>([
  ...(['Ground Crew Lead', 'Forest Ranger', 'Emergency Dispatcher', 'Field Observer'] as const)
    .map(s => [s, 'customer'] as const),
  ...(['Incident Commander', 'Civil Protection Director', 'GIS Analyst', 'Coordination Centre (RLZ)'] as const)
    .map(s => [s, 'internal'] as const),
  ...([
    'Mayor / Municipal Government', 'Meteorologist (AEMET)', 'Regional Forest Authority',
    'Volunteer Fire Brigade (VVFF)', 'Military Emergency Unit (UME)',
    'Air Support Coordinator', 'Regional Police',
  ] as const).map(s => [s, 'external'] as const),
  ...(['National Ministry', 'Citizens / Evacuees', 'Media & Press', 'NGO / Red Cross', 'Research Institution', 'EU Observer'] as const)
    .map(s => [s, 'public'] as const),
])

type ZoneKey = 'customer' | 'internal' | 'external' | 'public' | 'other'

function groupByZone(all: string[]): Record<ZoneKey, string[]> {
  const groups: Record<ZoneKey, string[]> = { customer: [], internal: [], external: [], public: [], other: [] }
  for (const s of all) {
    const zone = ZONE_MAP.get(s) ?? 'other'
    groups[zone].push(s)
  }
  return groups
}

// ── Relationship legend overlay ───────────────────────────────────────────────

function RelLegend() {
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 rounded-lg border border-line bg-paper-raised/90 px-3 py-2.5 backdrop-blur-sm">
      <p className="mb-1.5 text-meta font-medium text-ink">{t('stakeholder_map.legend_title')}</p>
      <div className="space-y-1.5">
        <LegendRow color="var(--color-line-strong)" label={t('stakeholder_map.rel_relates')} />
        <LegendRow color="var(--color-sage-600)" arrow label={t('stakeholder_map.rel_informs')} />
        <LegendRow color="var(--color-ink-muted)" thick label={t('stakeholder_map.rel_institutional')} />
        <LegendRow color="var(--color-danger)" dash label={t('stakeholder_map.rel_conflicts')} />
      </div>
    </div>
  )
}

function LegendRow({ color, dash = false, thick = false, arrow = false, label }: {
  color: string; dash?: boolean; thick?: boolean; arrow?: boolean; label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="10" viewBox="0 0 28 10" fill="none" aria-hidden="true">
        <line
          x1="0" y1="5" x2={arrow ? '20' : '28'} y2="5"
          style={{ stroke: color }}
          strokeWidth={thick ? 2.5 : 1.5}
          strokeDasharray={dash ? '4 2' : undefined}
        />
        {arrow && (
          <polyline
            points="16,2 22,5 16,8"
            style={{ stroke: color }}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
      <span className="text-[11px] text-ink-muted">{label}</span>
    </div>
  )
}

// ── Inner component (needs ReactFlowProvider context) ─────────────────────────

interface InnerProps {
  slug: string | undefined
  broadcastMessage: string | null
  dismissBroadcast: () => void
  connected: boolean
}

function StakeholderMapInner({ slug, broadcastMessage, dismissBroadcast, connected }: InnerProps) {
  const { screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [stakeholders, setStakeholders] = useState<string[]>([])
  const [nameInput, setNameInput] = useState('')
  const [collapsedZones, setCollapsedZones] = useState<Set<ZoneKey>>(new Set())

  // Pre-seed the sidebar with stakeholder suggestions configured by the facilitator
  useEffect(() => {
    if (!slug) return
    fetch(`/api/v1/sessions/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then((s: { stakeholder_suggestions?: string[] } | null) => {
        if (s?.stakeholder_suggestions?.length) {
          setStakeholders(s.stakeholder_suggestions)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])
  const [useCase, setUseCase] = useState('')
  const [findings, setFindings] = useState('')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // Autosave
  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaving(true)
      save(false).finally(() => setSaving(false))
    }, 2000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, useCase, findings])

  async function save(markCompleted: boolean) {
    const stakeholderNodes = nodes
      .filter(n => n.type === 'stakeholderNode')
      .map(n => ({
        id: n.id,
        name: (n.data as { name: string; role: string }).name,
        role: (n.data as { name: string; role: string }).role,
        position: n.position,
      }))

    const edgePayload = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: (e.data as { relType?: string } | undefined)?.relType ?? 'relates',
    }))

    await participantFetch('/api/v1/templates/stakeholder-map', {
      method: 'PUT',
      body: JSON.stringify({
        nodes: stakeholderNodes,
        edges: edgePayload,
        use_case: useCase,
        findings,
        completed: markCompleted,
      }),
    })
  }

  async function submit() {
    if (nodes.filter(n => n.type === 'stakeholderNode').length === 0) {
      toast.warning(t('stakeholder_map.warn_empty'), { duration: 4000 })
    }
    setSaving(true)
    try {
      await save(true)
      setCompleted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  function addStakeholder() {
    const name = nameInput.trim()
    if (!name || stakeholders.includes(name)) return
    setStakeholders(prev => [...prev, name])
    setNameInput('')
  }

  function removeStakeholder(name: string) {
    setStakeholders(prev => prev.filter(s => s !== name))
  }

  function toggleZone(key: ZoneKey) {
    setCollapsedZones(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const groupedStakeholders = useMemo(() => groupByZone(stakeholders), [stakeholders])

  const ZONE_DEFS: { key: ZoneKey; labelKey: string }[] = [
    { key: 'customer', labelKey: 'stakeholder_map.ring_customer' },
    { key: 'internal', labelKey: 'stakeholder_map.ring_internal' },
    { key: 'external', labelKey: 'stakeholder_map.ring_external' },
    { key: 'public',   labelKey: 'stakeholder_map.ring_public' },
    { key: 'other',    labelKey: '' },
  ]

  function onDragStart(e: React.DragEvent, name: string) {
    e.dataTransfer.setData('application/stakeholder-name', name)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function addNodeAt(name: string, position: { x: number; y: number }) {
    setNodes(prev => [...prev, { id: crypto.randomUUID(), type: 'stakeholderNode', position, data: { name, role: '' } }])
  }

  // Tap / keyboard alternative to dragging: place near the middle of the map, then move it onto a ring.
  function placeStakeholder(name: string) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const nudge = (nodes.length % 6) * 16
    addNodeAt(name, screenToFlowPosition({ x: rect.left + rect.width / 2 + nudge, y: rect.top + rect.height / 2 + nudge }))
    toast(t('canvas.added_to_canvas', { chip: name }), { duration: 1500 })
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const name = e.dataTransfer.getData('application/stakeholder-name')
    if (!name) return
    addNodeAt(name, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(prev =>
        addEdge(
          { ...connection, id: crypto.randomUUID(), type: 'relationshipEdge', data: { relType: 'relates' } },
          prev,
        ),
      )
    },
    [setEdges],
  )

  if (completed) {
    return (
      <CompletedScreen
        activity="stakeholder-map"
        broadcastMessage={broadcastMessage}
        onDismissBroadcast={dismissBroadcast}
        connected={connected}
      />
    )
  }

  const palette = (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-line p-4">
        <StepHeading n={1} title={t('stakeholder_map.use_case_label')} hint={t('stakeholder_map.use_case_hint')} htmlFor="use-case" />
        <textarea
          id="use-case"
          value={useCase}
          onChange={e => setUseCase(e.target.value)}
          placeholder={t('stakeholder_map.use_case_placeholder')}
          rows={4}
          className={cn(fieldCompact, 'mt-3 resize-none')}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <StepHeading n={2} title={t('stakeholder_map.stakeholders_label')} hint={t('stakeholder_map.stakeholders_hint')} htmlFor="new-stakeholder" />

        <form className="mt-3 mb-4 flex gap-1.5" onSubmit={e => { e.preventDefault(); addStakeholder() }}>
          <input
            id="new-stakeholder"
            autoComplete="off"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder={t('stakeholder_map.add_stakeholder_placeholder')}
            className={cn(fieldCompact, 'min-w-0 flex-1')}
          />
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="rounded-md border border-line-strong bg-paper-raised px-3 text-xs font-medium text-ink transition-colors hover:bg-paper-sunk disabled:opacity-40"
          >
            {t('stakeholder_map.add_stakeholder_button')}
          </button>
        </form>

        {stakeholders.length === 0 ? (
          <p className="py-4 text-center text-meta text-ink-subtle">{t('stakeholder_map.stakeholders_empty')}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-meta text-ink-muted">{t('stakeholder_map.tap_hint')}</p>
            {ZONE_DEFS.map(({ key, labelKey }) => {
              const items = groupedStakeholders[key]
              if (items.length === 0) return null
              const isCollapsed = collapsedZones.has(key)
              const label = key === 'other' ? t('stakeholder_map.ring_other') : t(labelKey)
              return (
                <section key={key}>
                  <button
                    type="button"
                    onClick={() => toggleZone(key)}
                    aria-expanded={!isCollapsed}
                    className="flex w-full items-center justify-between py-1 text-left text-sm font-medium text-ink transition-colors hover:text-clay-700"
                  >
                    {label}
                    <ChevronDown className={cn('h-4 w-4 text-ink-subtle transition-transform duration-200', isCollapsed && '-rotate-90')} aria-hidden="true" />
                  </button>

                  {!isCollapsed && (
                    <ul className="mt-2 flex flex-wrap gap-1.5 md:grid md:grid-cols-2">
                      {items.map(name => (
                        <li key={name} className="flex min-w-0 items-stretch rounded-md border border-line bg-paper-raised transition-colors hover:border-line-strong">
                          <button
                            type="button"
                            draggable
                            onDragStart={e => onDragStart(e, name)}
                            onClick={() => placeStakeholder(name)}
                            title={name}
                            className="min-h-9 min-w-0 flex-1 cursor-grab px-2.5 py-1.5 text-left text-xs leading-tight text-ink select-none active:cursor-grabbing"
                          >
                            <span className="line-clamp-2">{name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStakeholder(name)}
                            aria-label={t('stakeholder_map.remove_stakeholder', { name })}
                            className="inline-flex w-6 shrink-0 items-center justify-center rounded-r-md text-ink-subtle transition-colors hover:bg-danger-bg hover:text-danger"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <CanvasLayout
      title={t('stakeholder_map.title')}
      description={t('stakeholder_map.description')}
      submitLabel={t('stakeholder_map.done_button')}
      onSubmit={submit}
      saving={saving}
      broadcastMessage={broadcastMessage}
      onDismissBroadcast={dismissBroadcast}
      palette={palette}
    >
      <div className="flex h-full flex-col">
        <div ref={canvasRef} className="relative min-h-0 flex-1" onDragOver={onDragOver} onDrop={onDrop}>
          <RingBackground />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            deleteKeyCode="Delete"
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            fitView={false}
            className="tertulia-flow absolute inset-0"
            style={{ background: 'transparent' }}
            proOptions={{ hideAttribution: true }}
          />
          <RelLegend />
        </div>

        <div className="shrink-0 border-t border-line bg-paper-raised px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            <StepHeading n={5} title={t('stakeholder_map.findings_label')} htmlFor="findings" />
            <textarea
              id="findings"
              value={findings}
              onChange={e => setFindings(e.target.value)}
              placeholder={t('stakeholder_map.findings_placeholder')}
              rows={2}
              className={cn(fieldCompact, 'min-w-0 flex-1 resize-none')}
            />
          </div>
        </div>
      </div>
    </CanvasLayout>
  )
}

function StepHeading({ n, title, hint, htmlFor }: { n: number; title: string; hint?: string; htmlFor: string }) {
  return (
    <div className="flex shrink-0 items-baseline gap-2.5">
      <span className="font-display text-2xl leading-none text-clay-600" aria-hidden="true">{n}</span>
      <div>
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">{title}</label>
        {hint && <p className="text-meta text-ink-subtle">{hint}</p>}
      </div>
    </div>
  )
}

// ── Public export (wrapped in provider) ──────────────────────────────────────

export function StakeholderMap() {
  const { slug } = useParams<{ slug: string }>()
  const { broadcastMessage, dismissBroadcast, connected } = useWorkshopChannel(slug)

  return (
    <ReactFlowProvider>
      <StakeholderMapInner
        slug={slug}
        broadcastMessage={broadcastMessage}
        dismissBroadcast={dismissBroadcast}
        connected={connected}
      />
    </ReactFlowProvider>
  )
}
