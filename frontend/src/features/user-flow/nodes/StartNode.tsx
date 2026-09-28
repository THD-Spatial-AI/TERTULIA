import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { t } from '@/lib/i18n'

type StartNodeType = Node<Record<string, never>, 'startNode'>

export const StartNode = memo(function StartNode(_: NodeProps<StartNodeType>) {
  return (
    <div className="flex min-w-20 items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper">
      {t('canvas.start')}
      <Handle type="source" position={Position.Right} />
    </div>
  )
})
