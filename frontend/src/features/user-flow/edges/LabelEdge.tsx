import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { fieldCompact } from '@/components/ui/fieldStyles'

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
            placeholder={t('canvas.edge_placeholder')}
            aria-label={t('canvas.edge_label')}
            className={cn(fieldCompact, 'w-28 rounded-full px-2.5 py-0.5 text-center text-[11px]', !label && 'border-dashed bg-paper')}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  )
})
