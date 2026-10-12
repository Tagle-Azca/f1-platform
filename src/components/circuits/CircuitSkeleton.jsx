// Circuits skeletons, shaped like the loaded cards, rows, map and detail so the swap shifts nothing.
// Kept out of viz/VizSkeleton so the main chunk does not grow. Same contract: aria-busy wrapper, aria-hidden pieces.
const B = 'bg-edge-soft viz-pulse'
const Bar = ({ className = '' }) => <div aria-hidden="true" className={`${B} rounded-[2px] ${className}`} />
const Block = ({ className = '' }) => <div aria-hidden="true" className={`${B} rounded-md ${className}`} />

// ── Circuits (pass 4): shaped like the loaded cards, rows, map and detail so the swap shifts nothing ──
function CircuitCards({ count = 8 }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-pw-3">
      <Bar className="h-6 w-48" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(224px,1fr))] gap-pw-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex flex-col rounded-md border border-edge bg-panel p-pw-4">
            <Block className="aspect-[26/17] w-full" />
            <Bar className="mt-pw-3 h-4 w-4/5" />
            <Bar className="mt-pw-2 h-4 w-3/5" />
            <Bar className="mt-pw-2 h-4 w-2/3" />
            <div className="mt-pw-2 flex items-center justify-between"><Bar className="h-6 w-24 rounded-pill" /><Bar className="h-3 w-16" /></div>
            <div className="mt-pw-3 grid grid-cols-3 gap-pw-2 border-t border-edge-soft pt-pw-3">
              {[0, 1, 2].map((k) => <div key={k} className="flex flex-col gap-pw-1"><Bar className="h-4 w-10" /><Bar className="h-3 w-12" /></div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CircuitRows({ count = 6 }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-pw-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex min-h-24 gap-pw-3 rounded-md border border-edge bg-panel p-pw-3">
          <Block className="aspect-[4/3] w-24 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-pw-2">
            <Bar className="h-4 w-4/5" />
            <Bar className="h-3.5 w-3/5" />
            <Bar className="h-5 w-28 rounded-pill" />
            <Bar className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CircuitMap() {
  return (
    <div aria-hidden="true" className="flex gap-pw-4">
      <div className={`${B} relative h-[min(64svh,560px)] min-w-0 flex-1 rounded-md lg:h-[clamp(480px,calc(100svh-288px),680px)]`}>
        {[['left-[18%] top-[30%]'], ['left-[46%] top-[22%]'], ['left-[63%] top-[58%]'], ['left-[30%] top-[70%]']].map(([pos]) => (
          <span key={pos} className={`absolute size-3 rounded-pill bg-edge ${pos}`} />
        ))}
      </div>
      <div className="hidden w-[280px] shrink-0 flex-col gap-pw-2 rounded-md border border-edge bg-panel p-pw-3 lg:flex xl:w-[304px]">
        {Array.from({ length: 8 }, (_, i) => <Bar key={i} className="h-8 w-full" />)}
      </div>
    </div>
  )
}

function CircuitDetail({ hero = true }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-pw-7 lg:gap-pw-8">
      {hero && (
        <div className="grid gap-pw-5 lg:grid-cols-2 lg:items-center">
          <Block className="aspect-[3/2] max-h-60 w-full lg:order-2 lg:max-h-none" />
          <div className="flex flex-col gap-pw-3 lg:order-1">
            <Bar className="h-6 w-40 rounded-pill" />
            <Block className="h-10 w-3/5 md:h-14" />
            <Bar className="h-5 w-48" />
            <Bar className="h-4 w-72 max-w-full" />
            <div className="flex gap-pw-3"><Block className="h-11 w-36" /><Block className="h-11 w-32" /></div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-pw-3">
        <Bar className="h-6 w-28" />
        {Array.from({ length: 5 }, (_, i) => <Block key={i} className="h-14 w-full" />)}
      </div>
    </div>
  )
}

const VARIANTS = {
  circuitcards: CircuitCards,
  circuitrows: CircuitRows,
  circuitmap: CircuitMap,
  circuitdetail: CircuitDetail,
  circuitdetailresults: () => <CircuitDetail hero={false} />,
}

/** @param variant 'circuitcards' | 'circuitrows' | 'circuitmap' | 'circuitdetail' | 'circuitdetailresults' */
export default function CircuitSkeleton({ variant = 'circuitcards', name = 'circuits', className = '' }) {
  const Render = Object.hasOwn(VARIANTS, variant) ? VARIANTS[variant] : CircuitCards
  return (
    <div role="group" aria-busy="true" aria-label={`Loading ${name}`} data-viz-skeleton={variant} className={className}>
      <Render />
    </div>
  )
}
