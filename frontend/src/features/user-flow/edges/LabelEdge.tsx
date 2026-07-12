import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'

export const LabelEdge = memo(function LabelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps) {
  const { setEdges } = useReactFlow()
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const label = (data?.label as string) ?? ''

  function setLabel(value: string) {
    setEdges(eds =>
      eds.map(e => e.id === id ? { ...e, data: { ...e.data, label: value } } : e),
    )
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="label…"
            className="w-24 rounded-full border border-border bg-white px-2.5 py-0.5 text-center text-[11px] text-ink shadow-xs placeholder:text-ink-subtle/50 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/20"
          />
        </div>
      </EdgeLabelRenderer>
    </>
  )
})
