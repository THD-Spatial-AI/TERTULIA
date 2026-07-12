import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

type StartNodeType = Node<Record<string, never>, 'startNode'>

export const StartNode = memo(function StartNode(_: NodeProps<StartNodeType>) {
  return (
    <div className="flex min-w-[80px] items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">
      Start
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-emerald-700 !bg-white"
      />
    </div>
  )
})
