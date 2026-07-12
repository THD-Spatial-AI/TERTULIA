import { memo, useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { t, useLang } from '@/lib/i18n'

export type RelType = 'relates' | 'informs' | 'institutional' | 'conflicts'

const REL_CYCLE: RelType[] = ['relates', 'informs', 'institutional', 'conflicts']

const REL_STYLE: Record<RelType, { stroke: string; strokeWidth: number; strokeDasharray?: string; markerEnd?: string }> = {
  relates:      { stroke: '#cbd5e1', strokeWidth: 1.5 },
  informs:      { stroke: '#4a7c59', strokeWidth: 1.5, markerEnd: 'url(#arrow-informs)' },
  institutional:{ stroke: '#64748b', strokeWidth: 3 },
  conflicts:    { stroke: '#ef4444', strokeWidth: 1.5, strokeDasharray: '5 3' },
}

export interface RelationshipEdgeData {
  relType?: RelType
}

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  useLang()
  const { setEdges } = useReactFlow()
  const [open, setOpen] = useState(false)

  const relType: RelType = (data as RelationshipEdgeData)?.relType ?? 'relates'
  const style = REL_STYLE[relType]

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  function setType(type: RelType) {
    setEdges(es => es.map(e => e.id !== id ? e : { ...e, data: { ...e.data, relType: type } }))
    setOpen(false)
  }

  function deleteEdge(e: React.MouseEvent) {
    e.stopPropagation()
    setEdges(es => es.filter(e => e.id !== id))
  }

  return (
    <>
      {/* SVG marker defs — injected once per edge type but harmless if repeated */}
      <defs>
        <marker id="arrow-informs" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#4a7c59" />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        }}
        markerEnd={style.markerEnd}
      />

      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          className="nodrag nopan pointer-events-auto absolute"
        >
          {open ? (
            <div className="flex items-center gap-1 rounded-full border border-border bg-white px-2 py-1 shadow-md">
              {REL_CYCLE.map(type => (
                <button
                  key={type}
                  onClick={() => setType(type)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    type === relType
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-ink-subtle hover:bg-surface hover:text-ink'
                  }`}
                >
                  {t(`stakeholder_map.rel_${type}`)}
                </button>
              ))}
              <button
                onClick={deleteEdge}
                className="ml-1 text-ink-subtle transition-colors hover:text-error"
                title="Remove"
              >
                <svg className="h-3 w-3" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 2l6 6M8 2l-6 6" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-medium text-ink-subtle shadow-xs transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-sm"
            >
              {t(`stakeholder_map.rel_${relType}`)}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})
