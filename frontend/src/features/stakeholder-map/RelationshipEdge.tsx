import { memo, useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { X } from 'lucide-react'
import { t, useLang } from '@/lib/i18n'

export type RelType = 'relates' | 'informs' | 'institutional' | 'conflicts'

const REL_CYCLE: RelType[] = ['relates', 'informs', 'institutional', 'conflicts']

const REL_STYLE: Record<RelType, { stroke: string; strokeWidth: number; strokeDasharray?: string; markerEnd?: string }> = {
  relates:       { stroke: 'var(--color-line-strong)', strokeWidth: 1.5 },
  informs:       { stroke: 'var(--color-sage-600)', strokeWidth: 1.5, markerEnd: 'url(#arrow-informs)' },
  institutional: { stroke: 'var(--color-ink-muted)', strokeWidth: 2.5 },
  conflicts:     { stroke: 'var(--color-danger)', strokeWidth: 1.5, strokeDasharray: '5 3' },
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
          <path d="M0,0 L0,6 L8,3 z" style={{ fill: 'var(--color-sage-600)' }} />
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
            <div className="flex items-center gap-0.5 rounded-full border border-line bg-paper-raised p-1 shadow-float">
              {REL_CYCLE.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setType(type)}
                  aria-pressed={type === relType}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    type === relType
                      ? 'bg-ink text-paper'
                      : 'text-ink-muted hover:bg-paper-sunk hover:text-ink'
                  }`}
                >
                  {t(`stakeholder_map.rel_${type}`)}
                </button>
              ))}
              <button
                type="button"
                onClick={deleteEdge}
                aria-label={t('stakeholder_map.remove_relationship')}
                className="ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-danger-bg hover:text-danger"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={false}
              className="rounded-full border border-line bg-paper-raised px-2.5 py-0.5 text-[11px] font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              {t(`stakeholder_map.rel_${relType}`)}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})
