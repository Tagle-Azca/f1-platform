import { fmtLap, fmtDelta } from './telemetryUtils'
import { LineSwatch } from './TelemetrySection'
import { safeString } from '../../utils/safeText'

const BOX = 'min-w-36 rounded-md border border-edge bg-raise px-pw-3 py-pw-2 shadow-lg'

function Row({ color, dashed, code, time, pit }) {
  return (
    <div className="flex items-center gap-pw-2">
      <LineSwatch color={color} dashed={dashed} />
      <span className="w-9 text-xs text-ink-2">{safeString(code)}</span>
      <span className="num text-ink">{fmtLap(time)}</span>
      {pit && <span className="ml-auto text-xs font-medium text-signal-yellow">Pit</span>}
    </div>
  )
}

export default function LapTooltip({ active, payload, label, pitStops, pitStopsB, driverA, driverB, colorA, colorB }) {
  if (!active || !payload?.length) return null
  const timeA = payload.find(p => p.dataKey === 'a')?.value
  const timeB = payload.find(p => p.dataKey === 'b')?.value
  const pitA  = pitStops?.some(p => p.lap === label)
  const pitB  = pitStopsB?.some(p => p.lap === label)
  const delta = driverB && timeA && timeB ? timeB - timeA : null

  return (
    <div className={BOX}>
      <p className="mb-pw-1 text-xs font-semibold text-ink">Lap {label}</p>
      <div className="flex flex-col gap-pw-1">
        <Row color={colorA} code={driverA?.acronym} time={timeA} pit={pitA} />
        {driverB && <Row color={colorB} dashed code={driverB.acronym} time={timeB} pit={pitB} />}
      </div>
      {delta != null && (
        <p className="mt-pw-2 border-t border-edge-soft pt-pw-1 text-xs text-ink-2">
          <span className="num text-ink">{fmtDelta(delta)}</span>{' '}
          {delta > 0 ? `${safeString(driverA?.acronym)} faster` : delta < 0 ? `${safeString(driverB.acronym)} faster` : 'Same time'}
        </p>
      )}
    </div>
  )
}
