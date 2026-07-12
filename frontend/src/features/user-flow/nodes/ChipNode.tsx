import { memo, useState } from 'react'
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react'

type ChipNodeType = Node<{ label: string; note: string }, 'chipNode'>

export const ChipNode = memo(function ChipNode({ id, data }: NodeProps<ChipNodeType>) {
  const { setNodes, setEdges } = useReactFlow()
  const [showNote, setShowNote] = useState(false)

  function updateNote(value: string) {
    setNodes(nds =>
      nds.map(n => n.id === id ? { ...n, data: { ...n.data, note: value } } : n),
    )
  }

  function deleteNode(e: React.MouseEvent) {
    e.stopPropagation()
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
  }

  function toggleNote(e: React.MouseEvent) {
    e.stopPropagation()
    setShowNote(x => !x)
  }

  return (
    <div className="group relative min-w-[140px] max-w-[200px] rounded-xl border-2 border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !border-2 !border-brand-400 !bg-brand-50"
      />

      <div className="flex items-start justify-between gap-2 px-3 pb-1 pt-3">
        <span className="text-sm font-semibold leading-snug text-ink">{data.label}</span>
        <button
          onMouseDown={deleteNode}
          className="-mt-0.5 shrink-0 text-ink-subtle opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
          title="Remove chip"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <button
        onMouseDown={toggleNote}
        className="w-full px-3 pb-2 text-left text-[11px] text-ink-subtle transition-colors hover:text-brand-600"
      >
        {showNote ? '▾ note' : '▸ note'}
      </button>

      {showNote && (
        <div className="px-3 pb-3">
          <textarea
            value={data.note ?? ''}
            onChange={e => updateNote(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className="nodrag nopan w-full resize-none rounded-lg border border-border bg-surface-faint px-2 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none"
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !border-2 !border-brand-400 !bg-brand-50"
      />
    </div>
  )
})
