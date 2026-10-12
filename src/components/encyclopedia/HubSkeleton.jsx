// Loading shape for the hub grid: eight portrait cards from 640px, six row cards below, so the swap shifts nothing.
const B = 'bg-edge-soft viz-pulse'
const Bar = ({ className = '' }) => <div aria-hidden="true" className={`${B} rounded-[2px] ${className}`} />
const Block = ({ className = '' }) => <div aria-hidden="true" className={`${B} rounded-md ${className}`} />

function Portrait() {
  return (
    <div className="flex flex-col rounded-md border border-edge bg-panel p-pw-4">
      <Block className="aspect-[5/4] w-full" />
      <div className="mt-pw-3 min-h-14"><Bar className="h-4 w-3/5" /><Bar className="mt-pw-2 h-3.5 w-2/5" /></div>
      <div className="mt-pw-3 grid grid-cols-2 gap-pw-2 border-t border-edge-soft pt-pw-3">
        {[0, 1].map((k) => <div key={k} className="flex flex-col gap-pw-1"><Bar className="h-4 w-10" /><Bar className="h-3 w-12" /></div>)}
      </div>
    </div>
  )
}

function Row() {
  return (
    <div className="flex min-h-24 gap-pw-3 rounded-md border border-edge bg-panel p-pw-3">
      <Block className="aspect-[11/9] w-[88px] shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-pw-2"><Bar className="h-4 w-3/5" /><Bar className="h-3.5 w-2/5" /><Bar className="h-3.5 w-1/2" /></div>
    </div>
  )
}

export default function HubSkeleton({ wide = true, name = 'drivers' }) {
  const count = wide ? 8 : 6
  return (
    <div role="group" aria-busy="true" aria-label={`Loading ${name}`} data-viz-skeleton="hubcards" className="grid grid-cols-1 gap-pw-4 sm:grid-cols-[repeat(auto-fill,minmax(224px,1fr))]">
      {Array.from({ length: count }, (_, i) => (wide ? <Portrait key={i} /> : <Row key={i} />))}
    </div>
  )
}
