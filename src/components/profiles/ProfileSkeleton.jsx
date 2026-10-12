// Loading shapes for the profile pages, sized to the loaded layout so the swap shifts nothing.
// Same contract as VizSkeleton: aria-busy wrapper, aria-hidden pieces.
const B = 'bg-edge-soft viz-pulse'
const Bar = ({ className = '' }) => <div aria-hidden="true" className={`${B} rounded-[2px] ${className}`} />
const Block = ({ className = '' }) => <div aria-hidden="true" className={`${B} rounded-md ${className}`} />

export function HeroSkeleton() {
  return (
    <div aria-hidden="true" className="relative overflow-hidden rounded-md border border-edge bg-panel p-pw-4 md:p-pw-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-edge-soft" />
      <div className="grid items-center gap-pw-4 pt-pw-1 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-pw-6">
        <div className="flex flex-col gap-pw-3 md:order-1">
          <Bar className="h-6 w-48 rounded-pill" />
          <Bar className="h-4 w-24" />
          <Block className="h-10 w-3/5 md:h-12" />
          <Bar className="h-4 w-56 max-w-full" />
          <Bar className="h-5 w-40" />
        </div>
        <Block className="order-first h-40 md:order-2 md:h-56 lg:h-72" />
      </div>
    </div>
  )
}

export function StripSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-pw-4 border-t border-edge pt-pw-6">
      <Bar className="h-6 w-40" />
      <div className="grid grid-cols-2 gap-px bg-edge-soft md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="flex flex-col gap-pw-2 bg-bg px-pw-4 py-pw-3"><Block className="h-9 w-16" /><Bar className="h-3 w-14" /></div>)}
      </div>
      <div className="grid grid-cols-2 gap-x-pw-6 gap-y-pw-4 md:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="flex flex-col gap-pw-1"><Bar className="h-3 w-20" /><Bar className="h-4 w-12" /></div>)}
      </div>
    </div>
  )
}

export function RowsSkeleton({ count = 5, className = '' }) {
  return (
    <div aria-hidden="true" className={`flex flex-col gap-pw-3 border-t border-edge pt-pw-6 ${className}`}>
      <Bar className="h-6 w-32" />
      <div className="flex flex-col divide-y divide-edge-soft">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex min-h-12 items-center gap-pw-3 py-pw-2">
            <Bar className="h-4 w-10" /><Bar className="h-4 w-2/5" /><Bar className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function BarsSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-pw-4">
      {[0, 1].map((i) => <div key={i} className="flex flex-col gap-pw-2"><Bar className="h-4 w-20" /><Bar className="h-1.5 w-full" /><Bar className="h-3.5 w-3/5" /></div>)}
    </div>
  )
}

export function ChartSkeleton({ className = '' }) {
  return <Block className={`h-60 w-full md:h-72 xl:h-80 ${className}`} />
}

/** Whole-page skeleton; `variant` is 'driver' or 'constructor'. */
export default function ProfileSkeleton({ variant = 'driver', name }) {
  const label = name ?? (variant === 'constructor' ? 'team' : 'driver')
  return (
    <div role="group" aria-busy="true" aria-label={`Loading ${label}`} data-viz-skeleton={`profile-${variant}`} className="flex flex-col gap-pw-7 lg:gap-pw-8">
      <HeroSkeleton />
      <StripSkeleton />
      <RowsSkeleton />
      <RowsSkeleton count={4} />
    </div>
  )
}
