import RoundRow from './RoundRow'

export default function MonthGroup({ group, season, tz, now, current, defaultOpenKey }) {
  const n = group.rows.length
  return (
    <section aria-labelledby={`month-${group.key}`} className="min-w-0">
      <div className="flex items-baseline justify-between gap-pw-3 border-b border-edge pb-pw-2">
        <h3 id={`month-${group.key}`} className="font-display text-base font-semibold text-ink">{group.label}</h3>
        <span className="text-xs text-ink-3">{n} {n === 1 ? 'round' : 'rounds'}</span>
      </div>
      <ol className="list-none">
        {group.rows.map((row) => (
          <RoundRow
            key={row.race.round}
            row={row}
            season={season}
            tz={tz}
            now={now}
            current={current}
            defaultOpen={defaultOpenKey === row.race.round}
          />
        ))}
      </ol>
    </section>
  )
}
