import Panel from '../ui/Panel'
import EmptyState from '../ui/EmptyState'
import Rise from '../layout/Rise'
import ReliabilityBar from './ReliabilityBar'
import GridVsResultChart from './GridVsResultChart'
import { GRID_FILL, RESULT_FILL } from './telemetryConstants'
import TelemetrySection, { Legend, BlockSwatch } from './TelemetrySection'
import { safeString } from '../../utils/safeText'

function StatStrip({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-y-pw-4 sm:grid-cols-4 sm:divide-x sm:divide-edge-soft">
      {items.map(([label, value], i) => (
        <div key={label} className={`min-w-0 ${i % 4 === 0 ? 'sm:pr-pw-3' : 'sm:px-pw-3'}`}>
          <dd className="text-stat text-ink">{value ?? '—'}</dd>
          <dt className="mt-pw-1 text-xs text-ink-3">{label}</dt>
        </div>
      ))}
    </dl>
  )
}

function Meter({ label, value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : null
  return (
    <div className="border-b border-edge-soft py-pw-3 last:border-b-0">
      <p className="flex justify-between gap-pw-3 text-sm text-ink-2">
        {label}
        <span className="num text-ink">{value}{max != null ? ` / ${max}` : ''}</span>
      </p>
      {pct != null && (
        <span className="mt-pw-2 block h-1.5 rounded-[2px] bg-[var(--viz-track)]" aria-hidden="true">
          <span className="block h-full rounded-[2px] bg-steel" style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  )
}

export default function HistoricalSeasonView({ histData, selectedDriver, year, loadingHist }) {
  if (!loadingHist && histData && histData.races.length === 0) {
    return <EmptyState type="empty" message={`No race data for this driver in ${year}.`} height={120} />
  }
  if (!histData || !selectedDriver) return null
  const s = histData.stats
  const ppr = s.races ? (s.points / s.races).toFixed(1) : '0'

  return (
    <div className="flex flex-col gap-pw-7">
      <Rise index={1}>
        <Panel as="section" aria-labelledby="hist-driver" className="flex flex-col gap-pw-5">
          <div>
            <p className="text-sm text-ink-2">{year} season</p>
            <h2 id="hist-driver" className="text-title mt-pw-1 text-ink [overflow-wrap:anywhere]">{safeString(selectedDriver.name)}</h2>
          </div>
          <StatStrip items={[['Races', s.races], ['Wins', s.wins], ['Podiums', s.podiums], ['Points', s.points]]} />
          <StatStrip items={[['Poles', s.poles], ['Fastest laps', s.fastestLaps], ['Finishes', s.finishes], ['Reliability', `${s.reliability}%`]]} />
        </Panel>
      </Rise>

      <Rise index={2}>
        <TelemetrySection
          id="grid-h"
          title="Grid vs result"
          caption="Where the driver started and finished each race. Bars hang from P1, so a shorter bar is a better position."
          aside={(
            <Legend items={[
              { key: 'g', swatch: <BlockSwatch color={GRID_FILL} />, label: 'Started' },
              { key: 'up', swatch: <BlockSwatch color={RESULT_FILL.gained} />, label: 'Finished, gained' },
              { key: 'dn', swatch: <BlockSwatch color={RESULT_FILL.lost} />, label: 'Finished, lost' },
              { key: 'eq', swatch: <BlockSwatch color={RESULT_FILL.same} />, label: 'Finished, same' },
            ]} />
          )}
        >
          <GridVsResultChart races={histData.races} animationId={`${year}-${selectedDriver.driverId}`} />
        </TelemetrySection>
      </Rise>

      <Rise index={3} className="grid grid-cols-1 items-start gap-x-pw-6 gap-y-pw-7 lg:grid-cols-2">
        <TelemetrySection id="season-h" title="Season">
          <Meter label="Points scored" value={s.points} max={s.maxPoints} />
          <Meter label="Podiums" value={s.podiums} max={s.races} />
          <Meter label="Points per race" value={ppr} max={null} />
        </TelemetrySection>
        <TelemetrySection id="reliability-h" title="How races ended">
          <ReliabilityBar reliability={histData.reliability} total={s.races} />
        </TelemetrySection>
      </Rise>
    </div>
  )
}
