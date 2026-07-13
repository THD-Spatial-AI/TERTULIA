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
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { BroadcastBanner } from '@/components/ui/BroadcastBanner'
import { WorkshopProgress } from '@/components/ui/WorkshopProgress'
import { CompletedScreen } from '@/components/ui/CompletedScreen'
import { t } from '@/lib/i18n'
import { participantFetch } from '@/lib/api'
import { BACKEND_URL } from '@/lib/config'
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
    <div className="pointer-events-none absolute bottom-4 right-4 rounded-xl border border-border bg-white/90 px-3 py-2.5 shadow-xs backdrop-blur-sm">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        {t('stakeholder_map.legend_title')}
      </p>
      <div className="space-y-1.5">
        <LegendRow color="#cbd5e1" dash={false}  label={t('stakeholder_map.rel_relates')} />
        <LegendRow color="#4a7c59" dash={false}  arrow label={t('stakeholder_map.rel_informs')} />
        <LegendRow color="#64748b" thick         label={t('stakeholder_map.rel_institutional')} />
        <LegendRow color="#ef4444" dash          label={t('stakeholder_map.rel_conflicts')} />
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
          stroke={color}
          strokeWidth={thick ? 2.5 : 1.5}
          strokeDasharray={dash ? '4 2' : undefined}
        />
        {arrow && (
          <polyline
            points="16,2 22,5 16,8"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
      <span className="text-[10px] text-ink-subtle">{label}</span>
    </div>
  )
}

// ── Inner component (needs ReactFlowProvider context) ─────────────────────────

interface InnerProps {
  slug: string | undefined
  broadcastMessage: string | null
  dismissBroadcast: () => void
}

function StakeholderMapInner({ slug, broadcastMessage, dismissBroadcast }: InnerProps) {
  const { screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [stakeholders, setStakeholders] = useState<string[]>([])
  const [nameInput, setNameInput] = useState('')
  const [collapsedZones, setCollapsedZones] = useState<Set<ZoneKey>>(new Set())

  // Pre-seed the sidebar with stakeholder suggestions configured by the facilitator
  useEffect(() => {
    if (!slug) return
    fetch(`${BACKEND_URL}/api/v1/sessions/${slug}`)
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

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const name = e.dataTransfer.getData('application/stakeholder-name')
    if (!name) return
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'stakeholderNode',
      position: pos,
      data: { name, role: '' },
    }
    setNodes(prev => [...prev, newNode])
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
        message={t('stakeholder_map.completed')}
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

        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-white">

          {/* Step 1 — Use Case */}
          <div className="border-b border-border p-4">
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-border leading-none">1</span>
              <div>
                <p className="text-sm font-semibold text-ink">{t('stakeholder_map.use_case_label')}</p>
                <p className="text-[11px] text-ink-subtle">{t('stakeholder_map.use_case_hint')}</p>
              </div>
            </div>
            <textarea
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              placeholder={t('stakeholder_map.use_case_placeholder')}
              rows={4}
              className="w-full resize-none rounded-lg border border-border bg-surface-faint px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/15"
            />
          </div>

          {/* Step 2 — Stakeholders brainstorm */}
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-border leading-none">2</span>
              <div>
                <p className="text-sm font-semibold text-ink">{t('stakeholder_map.stakeholders_label')}</p>
                <p className="text-[11px] text-ink-subtle">{t('stakeholder_map.stakeholders_hint')}</p>
              </div>
            </div>

            {/* Add input */}
            <div className="mb-3 flex gap-1.5">
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStakeholder())}
                placeholder={t('stakeholder_map.add_stakeholder_placeholder')}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-faint px-3 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/15"
              />
              <button
                onClick={addStakeholder}
                disabled={!nameInput.trim()}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('stakeholder_map.add_stakeholder_button')}
              </button>
            </div>

            {/* Stakeholder list — grouped by ring zone */}
            {stakeholders.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-ink-subtle">
                {t('stakeholder_map.stakeholders_empty')}
              </p>
            ) : (
              <div className="flex-1 space-y-1 overflow-y-auto">
                {ZONE_DEFS.map(({ key, labelKey }) => {
                  const items = groupedStakeholders[key]
                  if (items.length === 0) return null
                  const isCollapsed = collapsedZones.has(key)
                  const label = key === 'other' ? t('stakeholder_map.ring_other') : t(labelKey as Parameters<typeof t>[0])
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => toggleZone(key)}
                        className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left transition-colors hover:bg-surface-faint"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                          {label}
                        </span>
                        <svg
                          className={`h-3 w-3 text-ink-subtle transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                        >
                          <path d="M2 4l4 4 4-4" />
                        </svg>
                      </button>

                      {!isCollapsed && (
                        <div className="mb-1 mt-0.5 grid grid-cols-2 gap-1">
                          {items.map(name => (
                            <div
                              key={name}
                              draggable
                              onDragStart={e => onDragStart(e, name)}
                              className="group relative flex min-h-[36px] cursor-grab select-none items-center rounded-lg border border-border bg-surface-faint px-2 py-1.5 transition-colors hover:border-brand-300 hover:bg-brand-50 active:cursor-grabbing"
                            >
                              <span className="line-clamp-2 text-[11px] font-medium leading-tight text-ink">
                                {name}
                              </span>
                              <button
                                onMouseDown={e => { e.stopPropagation(); removeStakeholder(name) }}
                                className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 text-ink-subtle hover:text-error"
                                title="Remove"
                              >
                                <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                  <path d="M2 2l6 6M8 2l-6 6" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {stakeholders.length > 0 && (
              <p className="mt-2 text-[10px] text-ink-subtle">{t('stakeholder_map.drag_hint')}</p>
            )}
          </div>
        </aside>

        {/* ── Canvas + findings column ──────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col">

          {/* Ring canvas */}
          <div
            className="relative min-h-0 flex-1"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
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
              className="absolute inset-0"
              style={{ background: 'transparent' }}
              proOptions={{ hideAttribution: true }}
            />

            <RelLegend />
          </div>

          {/* Step 5 — Findings */}
          <div className="shrink-0 border-t border-border bg-white">
            <div className="flex items-start gap-3 px-5 py-3">
              <div className="flex shrink-0 items-baseline gap-2 pt-0.5">
                <span className="text-2xl font-black text-border leading-none">5</span>
                <p className="text-sm font-semibold text-ink">{t('stakeholder_map.findings_label')}</p>
              </div>
              <textarea
                value={findings}
                onChange={e => setFindings(e.target.value)}
                placeholder={t('stakeholder_map.findings_placeholder')}
                rows={2}
                className="min-w-0 flex-1 resize-none rounded-lg border border-border bg-surface-faint px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/15"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-ink-subtle">
              {saving ? t('common.autosaving') : ''}
            </span>
            <Button size="lg" onClick={submit} loading={saving}>
              {t('stakeholder_map.done_button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Public export (wrapped in provider) ──────────────────────────────────────

export function StakeholderMap() {
  const { slug } = useParams<{ slug: string }>()
  const { broadcastMessage, dismissBroadcast } = useWorkshopChannel(slug)

  return (
    <ReactFlowProvider>
      <StakeholderMapInner
        slug={slug}
        broadcastMessage={broadcastMessage}
        dismissBroadcast={dismissBroadcast}
      />
    </ReactFlowProvider>
  )
}
