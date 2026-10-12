/**
 * Featured circuit numbers as a 3-up strip with hairline dividers (not cards).
 * A spec the data does not have removes its column. Hidden when nothing is available.
 */
export default function CircuitSpecStrip({ specs }) {
  if (!specs) return null
  const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const items = [
    fin(specs.length) !== null && { label: 'Lap length', value: specs.length.toFixed(1), unit: 'km' },
    fin(specs.turns) !== null && { label: 'Turns', value: String(specs.turns), unit: '' },
    fin(specs.laps) !== null && { label: 'Race laps', value: String(specs.laps), unit: '' },
  ].filter(Boolean)
  if (!items.length) return null
  return (
    <dl className="grid grid-flow-col auto-cols-fr divide-x divide-edge-soft">
      {items.map((it, i) => (
        <div key={it.label} className={i === 0 ? 'pr-pw-3' : 'px-pw-3'}>
          <dd className="text-stat text-ink">{it.value}{it.unit && <span className="ml-1 text-sm font-medium text-ink-3">{it.unit}</span>}</dd>
          <dt className="mt-pw-1 text-xs text-ink-3">{it.label}</dt>
        </div>
      ))}
    </dl>
  )
}
