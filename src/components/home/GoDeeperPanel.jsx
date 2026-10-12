import { Link } from 'react-router-dom'
import { Activity, Gauge, CircleDot, Network, ChevronRight } from 'lucide-react'

const LINKS = [
  { to: '/telemetry',     title: 'Telemetry',      note: 'Speed, throttle and brake traces', icon: Activity },
  { to: '/race-pace',     title: 'Race pace',      note: 'Stint averages and degradation',   icon: Gauge },
  { to: '/tire-strategy', title: 'Tire strategy',  note: 'Compound plans across the grid',   icon: CircleDot },
  { to: '/graph',         title: 'Graph explorer', note: 'Drivers and teams as a network',   icon: Network },
]

/** One hairline list; two columns from md (single column below 768px). */
export default function GoDeeperPanel() {
  return (
    <section className="section" aria-labelledby="go-deeper-h">
      <h2 id="go-deeper-h" className="text-heading mb-pw-3 text-ink">Go deeper</h2>
      <ul className="grid list-none grid-cols-1 gap-x-pw-8 md:grid-cols-2">
        {LINKS.map(({ to, title, note, icon: Icon }, i) => (
          <li key={to} className={`border-edge-soft ${i > 0 ? 'border-t' : ''} ${i === 1 ? 'md:border-t-0' : ''}`}>
            <Link
              to={to}
              className="flex min-h-14 items-center gap-pw-3 py-pw-3 no-underline text-ink [@media(hover:hover)]:hover:bg-hover"
            >
              <Icon aria-hidden="true" className="size-5 shrink-0 text-steel" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-medium">{title}</span>
                <span className="block text-sm leading-5 text-ink-3">{note}</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-3" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
