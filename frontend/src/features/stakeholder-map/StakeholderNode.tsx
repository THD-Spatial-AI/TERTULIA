import { memo, useState } from 'react'
import { Handle, NodeResizer, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react'
import { cn } from '@/lib/utils'

export interface StakeholderNodeData extends Record<string, unknown> {
  name: string
  role: string
}

export type StakeholderNodeType = Node<StakeholderNodeData, 'stakeholderNode'>

export const StakeholderNode = memo(function StakeholderNode({
  id,
  data,
  selected,
}: NodeProps<StakeholderNodeType>) {
  const { setNodes, setEdges } = useReactFlow()
  const [hovered, setHovered] = useState(false)

  function deleteNode() {
    setNodes(ns => ns.filter(n => n.id !== id))
    setEdges(es => es.filter(e => e.source !== id && e.target !== id))
  }

  function update(field: 'name' | 'role', value: string) {
    setNodes(ns =>
      ns.map(n => n.id !== id ? n : { ...n, data: { ...n.data, [field]: value } }),
    )
  }

  // Character count drives input width so the chip auto-fits its text.
  // NodeResizer lets the user override this with a manual drag.
  const nameSize = Math.max(5, (data.name || '').length + 1)
  const roleSize = Math.max(5, (data.role || '').length + 1)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative rounded-lg border bg-white px-2 py-1 shadow-xs transition-shadow',
        selected
          ? 'border-brand-400 shadow-sm ring-1 ring-brand-400/20'
          : 'border-border hover:border-brand-300 hover:shadow-sm',
      )}
    >
      <NodeResizer
        minWidth={60}
        minHeight={26}
        isVisible={selected === true}
        lineStyle={{ border: '1.5px dashed #4a7c59', borderRadius: '8px' }}
        handleStyle={{
          width: 6,
          height: 6,
          backgroundColor: '#4a7c59',
          border: 'none',
          borderRadius: '50%',
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border !border-border !bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border !border-border !bg-white"
      />

      {hovered && (
        <button
          onMouseDown={e => { e.stopPropagation(); deleteNode() }}
          className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border bg-white text-ink-subtle shadow-xs transition-colors hover:border-error hover:text-error"
          title="Remove"
        >
          <svg className="h-2 w-2" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" />
          </svg>
        </button>
      )}

      <input
        value={data.name}
        size={nameSize}
        onChange={e => update('name', e.target.value)}
        placeholder="Name"
        className="block bg-transparent text-[11px] font-semibold leading-tight text-ink placeholder:text-ink-subtle focus:outline-none"
      />
      <input
        value={data.role}
        size={roleSize}
        onChange={e => update('role', e.target.value)}
        placeholder="Role"
        className="block bg-transparent text-[10px] leading-tight text-ink-muted placeholder:text-ink-subtle focus:outline-none"
      />
    </div>
  )
})
