// Chart-shaped loading placeholders, sized to the final layout so the swap shifts nothing.
// Pieces are aria-hidden; the wrapper carries aria-busy + a label. Pulse is opacity only (off in reduced motion).

const B = 'bg-edge-soft viz-pulse'
const Bar = ({ className = '' }) => <div aria-hidden="true" className={`${B} rounded-[2px] ${className}`} />
const Block = ({ className = '' }) => <div aria-hidden="true" className={`${B} rounded-md ${className}`} />

// Static class names (Tailwind must see them): widths follow sqrt of the row index in the tower.
const TOWER_BARS = ['w-0', 'w-[28%]', 'w-[40%]', 'w-[49%]', 'w-[56%]', 'w-[63%]', 'w-[69%]', 'w-[74%]', 'w-[79%]', 'w-[84%]', 'w-[88%]', 'w-[92%]']

function Digits() {
  return (
    <div className="flex items-end gap-pw-3 h-10 md:h-14" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-end gap-1">
          <Block className="h-10 w-14 md:h-14" />
          <Bar className="h-3 w-3" />
        </div>
      ))}
    </div>
  )
}

function VerticalTimeline({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-pw-2 lg:hidden" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-11 items-center gap-pw-3 pl-pw-1">
          <Bar className="size-[10px]" />
          <Bar className="h-3.5 w-28" />
          <Bar className="ml-auto h-3.5 w-14" />
        </div>
      ))}
    </div>
  )
}

function Axis() {
  return (
    <div className="hidden lg:block h-[160px]" aria-hidden="true">
      <Bar className="mt-[80px] h-0.5 w-full" />
    </div>
  )
}

/** Stepped podium card (P2 | P1 | P3), sized like the loaded Standings hero. */
function Podium() {
  const col = (box, bar) => (
    <div className="flex min-w-0 flex-col items-center gap-pw-2">
      <Block className={`w-[88%] ${box}`} />
      <Bar className="h-5 w-3/4" />
      <Bar className={`h-7 ${bar}`} />
      <Bar className="h-1.5 w-2/3" />
    </div>
  )
  return (
    <div className="rounded-md border border-edge bg-panel p-pw-4 md:p-pw-6" aria-hidden="true">
      <Bar className="h-6 w-28" />
      <Bar className="mt-pw-2 h-4 w-3/5" />
      <div className="mt-pw-4 grid grid-cols-3 items-end gap-x-pw-2 md:gap-x-pw-4">
        {col('h-20 md:h-[104px] lg:h-[136px]', 'w-14')}
        {col('h-28 md:h-36 lg:h-44', 'w-20')}
        {col('h-20 md:h-[104px] lg:h-[136px]', 'w-14')}
      </div>
      <Bar className="mt-pw-4 h-3 w-2/3" />
    </div>
  )
}

// Abstract polylines (percent coordinates) for the chart skeleton
const LINES = ['0,92 25,70 50,52 75,30 100,12', '0,95 25,78 50,62 75,48 100,30', '0,96 25,84 50,74 75,60 100,50', '0,98 25,90 50,82 75,74 100,66', '0,99 25,94 50,90 75,84 100,80']

function Lines() {
  return (
    <div className="relative" aria-hidden="true">
      <Block className="h-[260px] w-full lg:h-[340px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        {LINES.map(points => <polyline key={points} points={points} fill="none" stroke="var(--pw-edge)" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
      </svg>
    </div>
  )
}

function StandingsRows({ count = 22 }) {
  return (
    <div className="flex flex-col divide-y divide-edge-soft" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex h-14 items-center gap-pw-2 px-pw-3 lg:h-[52px]">
          <Bar className="h-4 w-6" />
          <Bar className="h-3.5 w-8" />
          <Bar className="h-8 w-1" />
          <div className="flex min-w-0 flex-1 flex-col gap-pw-1">
            <Bar className="h-4 w-32" />
            <Bar className="h-3 w-24 lg:hidden" />
          </div>
          <Bar className="h-4 w-12" />
          <Bar className="h-4 w-4" />
        </div>
      ))}
    </div>
  )
}


const VARIANTS = {
  podium: Podium,
  lines: Lines,
  standingsrows: StandingsRows,
  hero: () => (
    <div className="flex flex-col gap-pw-4" aria-hidden="true">
      <Bar className="h-6 w-28 rounded-pill" />
      <div className="flex flex-col gap-pw-2">
        <Block className="h-9 w-[62%] md:h-12" />
        <Block className="h-9 w-[40%] md:h-12" />
      </div>
      <Bar className="h-4 w-3/5" />
      <Digits />
      <Block className="h-12 w-full md:w-44" />
      <VerticalTimeline />
      <Axis />
    </div>
  ),
  pointsrace: () => (
    <div className="flex flex-col divide-y divide-edge-soft" aria-hidden="true">
      {['w-full', 'w-3/5', 'w-[30%]'].map((w, i) => (
        <div key={i} className="flex min-h-16 items-center gap-pw-3 py-pw-3">
          <Bar className="h-6 w-1" />
          <div className="flex flex-1 flex-col gap-pw-2">
            <Bar className="h-4 w-40" />
            {i > 0 && <Bar className={`h-2 ${w}`} />}
          </div>
          <Bar className="h-4 w-14" />
        </div>
      ))}
    </div>
  ),
  rows: ({ count = 3 }) => (
    <div className="flex flex-col divide-y divide-edge-soft" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex min-h-12 items-center gap-pw-3 py-pw-2">
          <Bar className="h-4 w-5" />
          <Bar className="h-6 w-1" />
          <Bar className="h-3.5 w-28 md:w-[120px]" />
          <Bar className="ml-auto h-1.5 w-12" />
          <Bar className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  ),
  tower: ({ count = 20 }) => (
    <div aria-hidden="true">
      <div className="h-9 border-b border-edge" />
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex h-12 items-center gap-pw-3 border-b border-edge-soft px-pw-3">
          <Bar className="h-4 w-5" />
          <Bar className="h-6 w-1" />
          <Bar className="h-4 w-10" />
          <div className={`${B} size-5 rounded-pill`} />
          <div className="ml-auto flex w-[9.5rem] items-center gap-pw-2">
            <Bar className={`h-1.5 ${TOWER_BARS[Math.min(i, TOWER_BARS.length - 1)]}`} />
            <Bar className="ml-auto h-3.5 w-14" />
          </div>
        </div>
      ))}
    </div>
  ),
  timeline: () => (
    <div aria-hidden="true">
      <VerticalTimeline />
      <Axis />
    </div>
  ),
  digits: Digits,
  map: () => <Block className="h-[280px] w-full lg:h-[360px]" />,
}

/**
 * @param variant 'hero' | 'pointsrace' | 'rows' | 'tower' | 'timeline' | 'digits' | 'map' | 'podium' | 'lines' | 'standingsrows'
 * @param name    used in the accessible label: "Loading <name>"
 * @param count   row count for 'rows', 'tower' and 'standingsrows'
 */
export default function VizSkeleton({ variant = 'rows', name = 'content', count, className = '' }) {
  const Render = Object.hasOwn(VARIANTS, variant) ? VARIANTS[variant] : VARIANTS.rows
  return (
    <div role="group" aria-busy="true" aria-label={`Loading ${name}`} data-viz-skeleton={variant} className={className}>
      <Render count={count} />
    </div>
  )
}
