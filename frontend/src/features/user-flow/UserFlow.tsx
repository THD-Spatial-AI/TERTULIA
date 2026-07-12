import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/ui/Button'
import { BroadcastBanner } from '@/components/ui/BroadcastBanner'
import { WorkshopProgress } from '@/components/ui/WorkshopProgress'
import { CompletedScreen } from '@/components/ui/CompletedScreen'
import { t } from '@/lib/i18n'
import { participantFetch } from '@/lib/api'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { ChipPalette } from './ChipPalette'
import { StartNode } from './nodes/StartNode'
import { EndNode } from './nodes/EndNode'
import { ChipNode } from './nodes/ChipNode'
import { LabelEdge } from './edges/LabelEdge'
import type { Session } from '@/types'

const nodeTypes = { startNode: StartNode, endNode: EndNode, chipNode: ChipNode }
const edgeTypes = { labelEdge: LabelEdge }

const NEW_EDGE = {
  type: 'labelEdge',
  markerEnd: { type: MarkerType.ArrowClosed },
  data: { label: '' },
} as const

const INITIAL_NODES: Node[] = [
  { id: 'start', type: 'startNode', position: { x: 60, y: 160 }, data: {}, deletable: false },
  { id: 'end',   type: 'endNode',   position: { x: 560, y: 160 }, data: {}, deletable: false },
]

interface InnerProps {
  chips: string[]
  broadcastMessage: string | null
  dismissBroadcast: () => void
}

function UserFlowInner({ chips, broadcastMessage, dismissBroadcast }: InnerProps) {
  const { screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    const hasContent = nodes.some(n => n.type === 'chipNode') || edges.length > 0
    if (!hasContent) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaving(true)
      participantFetch('/api/v1/templates/user-flow', {
        method: 'PUT',
        body: JSON.stringify({ nodes, edges, completed: false }),
      })
        .catch(() => {})
        .finally(() => setSaving(false))
    }, 2000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges])

  async function submit() {
    const chipNodes = nodes.filter(n => n.type === 'chipNode')
    const connected = new Set([...edges.map(e => e.source), ...edges.map(e => e.target)])
    const orphans = chipNodes.filter(n => !connected.has(n.id))
    if (orphans.length > 0) {
      toast.warning(
        `${orphans.length} chip${orphans.length > 1 ? 's are' : ' is'} not connected — you can still complete.`,
        { duration: 4000 },
      )
    }
    setSaving(true)
    try {
      await participantFetch('/api/v1/templates/user-flow', {
        method: 'PUT',
        body: JSON.stringify({ nodes, edges, completed: true }),
      })
      setCompleted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge({ ...connection, ...NEW_EDGE }, eds))
    },
    [setEdges],
  )

  function onDragStart(e: React.DragEvent, label: string) {
    e.dataTransfer.setData('application/chip-label', label)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const label = e.dataTransfer.getData('application/chip-label')
    if (!label) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setNodes(prev => [
      ...prev,
      { id: crypto.randomUUID(), type: 'chipNode', position, data: { label, note: '' } },
    ])
  }

  if (completed) {
    return (
      <CompletedScreen
        message={t('user_flow.completed')}
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
        <ChipPalette chips={chips} onDragStart={onDragStart} />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border px-6 py-4">
            <h1 className="text-xl font-bold text-ink">{t('user_flow.title')}</h1>
            <p className="mt-0.5 text-sm text-ink-muted">{t('user_flow.description')}</p>
          </div>

          <div
            className="min-h-0 flex-1"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.4 }}
              deleteKeyCode="Delete"
              style={{ width: '100%', height: '100%' }}
            >
              <Background gap={16} color="#e5e7eb" />
              <Controls />
            </ReactFlow>
          </div>

          <div className="shrink-0 flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-ink-subtle">
              {saving ? t('common.autosaving') : ''}
            </span>
            <Button size="lg" onClick={submit} loading={saving}>
              {t('user_flow.done_button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserFlow() {
  const { slug } = useParams<{ slug: string }>()
  const [chips, setChips] = useState<string[]>([])
  const { broadcastMessage, dismissBroadcast } = useWorkshopChannel(slug)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/v1/sessions/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then((s: Session | null) => { if (s) setChips(s.user_flow_chips ?? []) })
      .catch(() => {})
  }, [slug])

  return (
    <ReactFlowProvider>
      <UserFlowInner
        chips={chips}
        broadcastMessage={broadcastMessage}
        dismissBroadcast={dismissBroadcast}
      />
    </ReactFlowProvider>
  )
}
