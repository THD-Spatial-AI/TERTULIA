import { memo } from 'react'
import { Handle, NodeResizer, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

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
      className={cn(
        'group relative rounded-md border bg-paper-raised px-2.5 py-1.5 transition-[border-color,box-shadow] duration-150',
        selected ? 'border-clay-600 shadow-float' : 'border-line-strong hover:shadow-float',
      )}
    >
      <NodeResizer
        minWidth={60}
        minHeight={26}
        isVisible={selected === true}
        lineStyle={{ border: '1.5px dashed var(--color-clay-600)', borderRadius: 'var(--radius-md)' }}
        handleStyle={{ width: 7, height: 7, backgroundColor: 'var(--color-clay-600)', border: 'none', borderRadius: '50%' }}
      />

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <button
        type="button"
        onClick={e => { e.stopPropagation(); deleteNode() }}
        aria-label={t('canvas.remove_node', { chip: data.name || t('stakeholder_map.node_name') })}
        className={cn(
          'nodrag absolute -top-2.5 -right-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-line-strong bg-paper-raised text-ink-subtle transition-[opacity,color,border-color] hover:border-danger hover:text-danger',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
        )}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>

      <input
        value={data.name}
        size={nameSize}
        onChange={e => update('name', e.target.value)}
        placeholder={t('stakeholder_map.node_name')}
        aria-label={t('stakeholder_map.node_name')}
        className="nodrag block bg-transparent text-xs leading-tight font-semibold text-ink placeholder:text-ink-subtle focus-visible:outline-none"
      />
      <input
        value={data.role}
        size={roleSize}
        onChange={e => update('role', e.target.value)}
        placeholder={t('stakeholder_map.node_role')}
        aria-label={t('stakeholder_map.node_role')}
        className="nodrag block bg-transparent text-[11px] leading-tight text-ink-muted placeholder:text-ink-subtle focus-visible:outline-none"
      />
    </div>
  )
})
