import TeamBar from '../viz/TeamBar'
import { fmtLap } from './telemetryUtils'
import { getRaceStatus } from '../../utils/raceUtils'
import { safeString } from '../../utils/safeText'

const CHIP = 'inline-flex min-h-6 items-center rounded-pill border px-pw-3 text-xs font-medium'

/** Race outcome in words; tone is a backup, never the only signal. */
function StatusChip({ kind, status }) {
  if (kind === 'finished') return <span className={`${CHIP} border-edge text-pos`}>Finished</span>
  if (kind === 'lapped')   return <span className={`${CHIP} border-edge text-ink-2`}>{safeString(status).replace(/laps?/i, m => m.toLowerCase())}</span>
  if (kind === 'dnf')      return <span className={`${CHIP} border-edge text-neg`}>DNF · {safeString(status)}</span>
  if (kind === 'dns')      return <span className={`${CHIP} border-edge text-neg`}>Did not start</span>
  return null
}

/** One driver's identity + a 4-up stat strip (hairline dividers, no cards). */
export default function DriverBannerCard({ driver, validLaps, bestLap, avgLap, pitStops, color, status, compact = false }) {
  const kind = status != null ? getRaceStatus(status) : (validLaps.length === 0 ? 'dns' : 'unknown')
  const dns  = kind === 'dns'
  // Lap times are 8 characters wide, so the strip uses a smaller numeral than the page-level text-stat
  const value = `font-display font-semibold tabular-nums text-ink ${compact ? 'text-lg' : 'text-2xl'}`
  const stats = [
    { label: 'Laps',      v: dns ? '—' : String(validLaps.length) },
    { label: 'Best lap',  v: dns ? '—' : fmtLap(bestLap) },
    { label: 'Average',   v: dns ? '—' : fmtLap(avgLap) },
    { label: 'Pit stops', v: dns ? '—' : String(pitStops.length) },
  ]

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-pw-3">
        <TeamBar color={color} height={compact ? 32 : 44} />
        <div className="min-w-0">
          <p className={`${compact ? 'text-heading' : 'text-title'} flex flex-wrap items-baseline gap-x-pw-2 text-ink [overflow-wrap:anywhere]`}>
            {safeString(driver.fullName)}
            <span className="num text-ink-3">{safeString(driver.acronym)}</span>
          </p>
          {driver.teamName && <p className="text-sm text-ink-2">{safeString(driver.teamName)}</p>}
        </div>
      </div>

      <div className="mt-pw-3"><StatusChip kind={kind} status={status} /></div>

      <dl className={`mt-pw-4 grid grid-cols-2 gap-y-pw-4 ${compact ? 'xl:grid-cols-4' : 'sm:grid-cols-4'}`}>
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 pr-pw-3">
            <dd className={value}>{s.v}</dd>
            <dt className="mt-pw-1 text-xs text-ink-3">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}
