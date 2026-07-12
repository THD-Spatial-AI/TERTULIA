import { useViewport } from '@xyflow/react'
import { t } from '@/lib/i18n'

/**
 * Renders the zone rings as a full-canvas SVG overlay.
 *
 * All ellipse positions are defined in flow-space coordinates and converted
 * to screen-space on every render using the live XYFlow viewport. This means
 * the SVG element itself never scales (no gaps at any zoom level) while the
 * rings still zoom and pan with the canvas.
 */
export function RingBackground() {
  const { x: vx, y: vy, zoom } = useViewport()

  // Flow → screen helpers
  const sx = (fx: number) => vx + fx * zoom
  const sy = (fy: number) => vy + fy * zoom
  const sr = (r:  number) => r  * zoom

  // Zone centers and radii are in flow coordinates.
  // At default zoom=1, pan=(0,0) with a ~700×550 canvas:
  //   Customer  cx=65  → screen 65px from left (rx 120 → left arc at -55px, always clipped)
  //   Public rx=595   → right edge at ~770px (just beyond canvas)
  const cCx = sx(65);  const cCy = sy(275)
  const iCx = sx(90);  const iCy = sy(270)
  const eCx = sx(140); const eCy = sy(265)
  const pCx = sx(175); const pCy = sy(258)

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      {/*
        No viewBox, no transform — SVG coordinate system == screen pixels.
        overflow-hidden on the parent clips arcs that extend outside the canvas.
      */}
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Painted back → front so Customer is on top */}

        {/* Public — largest, most tilted */}
        <ellipse
          cx={pCx} cy={pCy} rx={sr(595)} ry={sr(510)}
          transform={`rotate(-13, ${pCx}, ${pCy})`}
          fill="#ecf0f6" stroke="#d4dae6" strokeWidth="1.5"
        />

        {/* External */}
        <ellipse
          cx={eCx} cy={eCy} rx={sr(400)} ry={sr(345)}
          transform={`rotate(-9, ${eCx}, ${eCy})`}
          fill="#f1f4f9" stroke="#d4dae6" strokeWidth="1.5"
        />

        {/* Internal */}
        <ellipse
          cx={iCx} cy={iCy} rx={sr(250)} ry={sr(220)}
          transform={`rotate(-5, ${iCx}, ${iCy})`}
          fill="#f6f8fb" stroke="#d4dae6" strokeWidth="1.5"
        />

        {/* Customer / User — always partially clipped by the left edge */}
        <ellipse
          cx={cCx} cy={cCy} rx={sr(120)} ry={sr(140)}
          fill="#ffffff" stroke="#d4dae6" strokeWidth="1.5"
        />

        {/* Zone labels — also in flow space so they travel with their zone */}
        <text x={sx(130)} y={sy(265)}
          textAnchor="middle" fontSize="10.5" fontWeight="500"
          fill="#a0aec0" fontFamily="system-ui, sans-serif">
          {t('stakeholder_map.ring_customer')}
        </text>
        <text x={sx(258)} y={sy(208)}
          textAnchor="middle" fontSize="10.5" fontWeight="500"
          fill="#a0aec0" fontFamily="system-ui, sans-serif">
          {t('stakeholder_map.ring_internal')}
        </text>
        <text x={sx(422)} y={sy(158)}
          textAnchor="middle" fontSize="10.5" fontWeight="500"
          fill="#a0aec0" fontFamily="system-ui, sans-serif">
          {t('stakeholder_map.ring_external')}
        </text>
        <text x={sx(592)} y={sy(108)}
          textAnchor="middle" fontSize="10.5" fontWeight="500"
          fill="#a0aec0" fontFamily="system-ui, sans-serif">
          {t('stakeholder_map.ring_public')}
        </text>
      </svg>
    </div>
  )
}
