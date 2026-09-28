import { memo, useState } from 'react'
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react'
import { ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { fieldCompact } from '@/components/ui/fieldStyles'

type ChipNodeType = Node<{ label: string; note: string }, 'chipNode'>

export const ChipNode = memo(function ChipNode({ id, data }: NodeProps<ChipNodeType>) {
  const { setNodes, setEdges } = useReactFlow()
  const [showNote, setShowNote] = useState(Boolean(data.note))

  function updateNote(value: string) {
    setNodes(nds => nds.map(n => (n.id === id ? { ...n, data: { ...n.data, note: value } } : n)))
  }

  function deleteNode(e: React.MouseEvent) {
    e.stopPropagation()
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id))
  }

  return (
    <div className="w-48 rounded-md border border-line-strong bg-paper-raised shadow-float">
      <Handle type="target" position={Position.Left} />

      <div className="flex items-start justify-between gap-1 py-2.5 pr-1.5 pl-3">
        <span className="text-sm leading-snug font-medium text-ink">{data.label}</span>
        <button
          type="button"
          onClick={deleteNode}
          aria-label={t('canvas.remove_node', { chip: data.label })}
          className="nodrag -mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-subtle transition-colors hover:bg-danger-bg hover:text-danger"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={e => { e.stopPropagation(); setShowNote(x => !x) }}
        aria-expanded={showNote}
        className="nodrag flex w-full items-center gap-1 border-t border-line px-3 py-1.5 text-left text-meta text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform duration-150', showNote && 'rotate-90')} aria-hidden="true" />
        {t('canvas.note')}
      </button>

      {showNote && (
        <div className="px-3 pb-3">
          <label htmlFor={`note-${id}`} className="sr-only">{t('canvas.note')}</label>
          <textarea
            id={`note-${id}`}
            value={data.note ?? ''}
            onChange={e => updateNote(e.target.value)}
            placeholder={t('canvas.note_placeholder')}
            rows={2}
            className={cn(fieldCompact, 'nodrag nopan resize-none')}
          />
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  )
})
