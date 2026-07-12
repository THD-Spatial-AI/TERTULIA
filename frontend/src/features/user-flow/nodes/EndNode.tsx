import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

type EndNodeType = Node<Record<string, never>, 'endNode'>

export const EndNode = memo(function EndNode(_: NodeProps<EndNodeType>) {
  return (
    <div className="flex min-w-[80px] items-center justify-center rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-rose-700 !bg-white"
      />
      End
    </div>
  )
})
