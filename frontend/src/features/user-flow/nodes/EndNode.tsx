import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { t } from '@/lib/i18n'

type EndNodeType = Node<Record<string, never>, 'endNode'>

export const EndNode = memo(function EndNode(_: NodeProps<EndNodeType>) {
  return (
    <div className="flex min-w-20 items-center justify-center rounded-full border-[1.5px] border-ink bg-paper-raised px-5 py-2 text-sm font-medium text-ink">
      <Handle type="target" position={Position.Left} />
      {t('canvas.end')}
    </div>
  )
})
