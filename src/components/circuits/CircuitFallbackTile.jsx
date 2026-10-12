import { monogram, formatCoords, locatorPoint, LOCATOR } from './circuitFormat'
import { TYPE_TONES } from '../../styles/vizPalette'

// Static class names per size (Tailwind must see them whole).
const SIZES = {
  card: { mono: 'text-[32px]', rule: 'w-6', svg: 'h-8 w-16', coords: 'num text-xs text-ink-3', showCoords: true },
  row: { mono: 'text-2xl', rule: 'w-4', svg: 'h-6 w-12', coords: '', showCoords: false },
  hero: { mono: 'text-[96px]', rule: 'w-12', svg: 'h-20 w-40', coords: 'num text-sm text-ink-2', showCoords: true },
  mini: { mono: 'text-2xl', rule: 'w-4', svg: 'hidden', coords: '', showCoords: false },
}

/** Equirectangular locator: hairline frame, 3 meridians, 3 parallels, one dot (SVG attributes only, no inline style). */
export function Locator({ lat, lng, type, className = '' }) {
  const { cx, cy } = locatorPoint(lat, lng)
  const tone = TYPE_TONES[type] ?? 'var(--pw-ink-3)'
  return (
    <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${LOCATOR.w} ${LOCATOR.h}`} className={className} data-locator>
      <g stroke="var(--viz-grid)" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {[30, 60, 90].map((x) => <line key={`m${x}`} x1={x} y1="0" x2={x} y2={LOCATOR.h} vectorEffect="non-scaling-stroke" />)}
        {[15, 30, 45].map((y) => <line key={`p${y}`} x1="0" y1={y} x2={LOCATOR.w} y2={y} vectorEffect="non-scaling-stroke" />)}
      </g>
      <rect x="0.5" y="0.5" width={LOCATOR.w - 1} height={LOCATOR.h - 1} rx="2" fill="none" stroke="var(--viz-baseline)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle cx={cx} cy={cy} r="6" fill="none" stroke={tone} strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle cx={cx} cy={cy} r="3" fill={tone} />
    </svg>
  )
}

/**
 * Stand-in for a missing outline, same box as the outline well. Monogram from the locality (ink-2 text, tone rule beneath),
 * coordinates as real text, a locator dot from lat/long. Decorative parts are aria-hidden.
 */
export default function CircuitFallbackTile({ circuit, size = 'card', caption = false }) {
  const s = SIZES[size] ?? SIZES.card
  const coords = formatCoords(circuit.lat, circuit.lng)
  const hasPoint = coords !== null
  return (
    <div data-fallback-tile data-type={circuit.type} className="flex size-full min-h-0 flex-col justify-between gap-pw-2">
      <div aria-hidden="true" className="flex flex-col gap-pw-1">
        <span className={`font-display font-bold leading-none text-ink-2 ${s.mono}`}>{monogram(circuit.locality, circuit.name)}</span>
        <span className={`tone-rule ${s.rule}`} />
      </div>
      <div className="flex min-w-0 items-end justify-between gap-pw-2">
        <div className="min-w-0">
          {hasPoint && s.showCoords && <p className={s.coords}>{coords}</p>}
          {caption && <p className="mt-pw-1 text-xs text-ink-3">No track outline available</p>}
        </div>
        {hasPoint && s.svg !== 'hidden' && <Locator lat={circuit.lat} lng={circuit.lng} type={circuit.type} className={`shrink-0 ${s.svg}`} />}
      </div>
    </div>
  )
}
