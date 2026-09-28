import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
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

import { CanvasLayout } from '@/components/canvas/CanvasLayout'
import { ChipPalette, CHIP_MIME } from '@/components/canvas/ChipPalette'
import { CompletedScreen } from '@/components/ui/CompletedScreen'
import { t } from '@/lib/i18n'
import { participantFetch } from '@/lib/api'
import { useWorkshopChannel } from '@/lib/useWorkshopChannel'
import { groupFlowChips } from './flowChips'
import { StartNode } from './nodes/StartNode'
import { EndNode } from './nodes/EndNode'
import { ChipNode } from './nodes/ChipNode'
import { LabelEdge } from './edges/LabelEdge'
import type { Session } from '@/types'

const nodeTypes = { startNode: StartNode, endNode: EndNode, chipNode: ChipNode }
const edgeTypes = { labelEdge: LabelEdge }

const NEW_EDGE = {
  type: 'labelEdge',
  markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-ink-muted)' },
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
  connected: boolean
}

function UserFlowInner({ chips, broadcastMessage, dismissBroadcast, connected }: InnerProps) {
  const { screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
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
      toast.warning(t('canvas.orphans', { count: orphans.length }), { duration: 4000 })
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

  function addChipAt(label: string, position: { x: number; y: number }) {
    setNodes(prev => [
      ...prev,
      { id: crypto.randomUUID(), type: 'chipNode', position, data: { label, note: '' } },
    ])
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const label = e.dataTransfer.getData(CHIP_MIME)
    if (!label) return
    addChipAt(label, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }

  // Tap / keyboard alternative to dragging: drop the chip near the middle of the visible canvas,
  // nudged so repeated taps don't stack exactly on top of each other.
  function pickChip(label: string) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const nudge = (nodes.length % 6) * 18
    addChipAt(label, screenToFlowPosition({ x: rect.left + rect.width / 2 - 60 + nudge, y: rect.top + rect.height / 2 - 20 + nudge }))
    toast(t('canvas.added_to_canvas', { chip: label }), { duration: 1500 })
  }

  if (completed) {
    return (
      <CompletedScreen
        activity="user-flow"
        broadcastMessage={broadcastMessage}
        onDismissBroadcast={dismissBroadcast}
        connected={connected}
      />
    )
  }

  return (
    <CanvasLayout
      title={t('user_flow.title')}
      description={t('user_flow.description')}
      submitLabel={t('user_flow.done_button')}
      onSubmit={submit}
      saving={saving}
      broadcastMessage={broadcastMessage}
      onDismissBroadcast={dismissBroadcast}
      palette={
        <ChipPalette
          chips={chips}
          group={groupFlowChips}
          onPick={pickChip}
          hint={t('canvas.flow_tap_hint')}
          emptyText={t('user_flow.chips_empty')}
          customPlaceholder={t('user_flow.custom_chip_placeholder')}
        />
      }
    >
      <div ref={canvasRef} className="h-full" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
          deleteKeyCode="Delete"
          className="tertulia-flow"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="var(--color-line-strong)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </CanvasLayout>
  )
}

export function UserFlow() {
  const { slug } = useParams<{ slug: string }>()
  const [chips, setChips] = useState<string[]>([])
  const { broadcastMessage, dismissBroadcast, connected } = useWorkshopChannel(slug)

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
        connected={connected}
      />
    </ReactFlowProvider>
  )
}
