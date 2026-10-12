import StatLine from '../ui/StatLine'

function Group({ title, children }) {
  return (
    <div>
      <h3 className="mt-pw-3 mb-pw-1 font-sans text-sm font-medium text-ink-2">{title}</h3>
      <dl>{children}</dl>
    </div>
  )
}

/** Track specs. Body only: the page wraps it in a Disclosure. */
/** `hideFeatured` omits lap length, laps and turns when the page already shows them in the spec strip. */
export default function PoleRecordPanel({ specs, hideFeatured = false }) {
  if (!specs) return null
  const raceDist = (specs.length * specs.laps).toFixed(1)

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-pw-6 min-[480px]:grid-cols-2">
        <div>
          <Group title="Car demand">
            <StatLine label="Tire stress" hint value={`${specs.tireStress}/10`} />
            <StatLine label="Braking" hint value={`${specs.braking}/10`} />
          </Group>
          <Group title="Performance">
            <StatLine label="Top speed" value={`${specs.topSpeed} km/h`} />
            <StatLine label="Max G-force" value={`${specs.gforce}G`} />
            <StatLine label="Full throttle" value={`${specs.throttle}%`} />
          </Group>
        </div>
        <Group title="Circuit">
          {!hideFeatured && <StatLine label="Lap length" value={`${specs.length.toFixed(1)} km`} />}
          <StatLine label="Race dist." value={`${raceDist} km`} />
          {!hideFeatured && <StatLine label="Laps" value={specs.laps} />}
          {!hideFeatured && <StatLine label="Turns" value={specs.turns} />}
          <StatLine label="Gear changes" value={`${specs.gearChanges}/lap`} />
        </Group>
      </div>

      {specs.pitLoss ? (
        <div className="mt-pw-4 flex items-center justify-between gap-pw-3 border-t border-edge-soft pt-pw-3">
          <div>
            <p className="text-sm font-medium text-ink-2">Average pit loss</p>
            <p className="text-xs text-ink-3">Time lost in the pit lane</p>
          </div>
          <p className="text-stat text-ink">{specs.pitLoss}<span className="ml-0.5 text-base font-medium text-ink-2">s</span></p>
        </div>
      ) : null}

      <p className="mt-pw-3 text-xs text-ink-3">
        * Estimated from historical race data and 2026 technical projections.
      </p>
    </div>
  )
}
