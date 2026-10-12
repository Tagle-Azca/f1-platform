import TeamBar from '../viz/TeamBar'
import TelemetrySection from './TelemetrySection'
import { safeString } from '../../utils/safeText'

const fmtDur = (d) => (Number.isFinite(d) ? `${d.toFixed(1)} s` : '—')

function StopList({ stops, opposingStops }) {
  if (!stops.length) return <p className="py-pw-3 text-sm text-ink-3">No pit stops.</p>
  return (
    <ol className="flex flex-col">
      {stops.map(p => {
        const opp   = opposingStops?.find(o => o.stop_number === p.stop_number)
        const gain  = Number.isFinite(p.duration) && Number.isFinite(opp?.duration) ? opp.duration - p.duration : null
        return (
          <li key={p.stop_number} className="flex min-h-11 items-center gap-pw-3 border-b border-edge-soft py-pw-2 last:border-b-0">
            <span className="w-14 shrink-0 text-sm text-ink-2">Stop {p.stop_number}</span>
            <span className="text-xs text-ink-3">Lap {p.lap}</span>
            <span className="num ml-auto text-ink">{fmtDur(p.duration)}</span>
            {gain != null && gain > 0 && <span className="num w-16 text-right text-pos">−{gain.toFixed(1)} s</span>}
            {gain != null && gain <= 0 && <span className="w-16" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}

export default function PitStopsPanel({ pitStops, pitStopsB, isComparing, driverA, driverB, colorA, colorB }) {
  const both = isComparing && pitStopsB?.length > 0
  const total = pitStops.reduce((s, p) => s + (Number.isFinite(p.duration) ? p.duration : 0), 0)

  return (
    <TelemetrySection
      id="pits-h"
      title="Pit stops"
      caption={both ? 'Time in the pit lane. A green figure is the time gained over the other driver at that stop.' : `Time in the pit lane${pitStops.length > 1 ? `, ${total.toFixed(1)} s in total` : ''}.`}
    >
      {both ? (
        <div className="grid grid-cols-1 gap-pw-5 sm:grid-cols-2">
          {[[driverA, pitStops, pitStopsB, colorA], [driverB, pitStopsB, pitStops, colorB]].map(([d, stops, opp, c]) => (
            <div key={d?.driverId ?? 'x'} className="min-w-0">
              <p className="mb-pw-1 flex items-center gap-pw-2 text-sm font-medium text-ink">
                <TeamBar color={c} height={16} />{safeString(d?.acronym)}
              </p>
              <StopList stops={stops} opposingStops={opp} />
            </div>
          ))}
        </div>
      ) : (
        <StopList stops={pitStops} />
      )}
    </TelemetrySection>
  )
}
