const NAMES = { sector1: 'Sector 1', sector2: 'Sector 2', sector3: 'Sector 3' }

export default function SectorTooltip({ active, payload, label, driverA, driverB }) {
  if (!active || !payload?.length) return null
  const nameOf = (p) => {
    const m = /^s(\d)_(a|b)$/.exec(p.dataKey)
    if (m) return `S${m[1]} ${m[2] === 'a' ? driverA?.acronym ?? '' : driverB?.acronym ?? ''}`
    return NAMES[p.dataKey] ?? p.name
  }
  return (
    <div className="min-w-36 rounded-md border border-edge bg-raise px-pw-3 py-pw-2 shadow-lg">
      <p className="mb-pw-1 text-xs font-semibold text-ink">Lap {label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="flex justify-between gap-pw-3 text-xs text-ink-2">
          <span>{nameOf(p)}</span>
          <span className="num text-ink">{p.value > 0 ? `${p.value.toFixed(3)} s` : '—'}</span>
        </p>
      ))}
    </div>
  )
}
